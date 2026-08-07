// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import SelectionMenu from "./SelectionMenu.svelte";
import type { Definition as DefinitionType } from "$lib/types/types";

vi.mock("$lib/clipboard", () => ({
	copyText: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("$lib/dictionary", () => ({
	loadDefinitions: vi.fn(),
	wordUrl: (word: string) => `/?word=${encodeURIComponent(word)}`
}));

import { copyText } from "$lib/clipboard";
import { loadDefinitions } from "$lib/dictionary";

const defs: DefinitionType[] = [
	{
		part_of_speech: "n.",
		definition: "shoulder"
	}
];

function fakeSelection(text: string) {
	const rect = { left: 0, top: 0, width: 10, height: 10 } as DOMRect;
	return {
		rangeCount: 1,
		isCollapsed: false,
		anchorNode: document.body,
		toString: () => text,
		removeAllRanges: vi.fn(),
		getRangeAt: () => ({
			getClientRects: () => [rect],
			getBoundingClientRect: () => rect
		})
	};
}

let selectionSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	vi.clearAllMocks();
	selectionSpy = vi.spyOn(window, "getSelection");
});

afterEach(() => {
	selectionSpy.mockRestore();
});

describe("SelectionMenu", () => {
	it("is empty on mount", () => {
		render(SelectionMenu);
		expect(screen.queryByRole("button", { name: "Define" })).not.toBeInTheDocument();
	});

	it("shows the action bar when text is selected", async () => {
		selectionSpy.mockReturnValue(fakeSelection("abaga") as unknown as Selection);
		render(SelectionMenu);

		fireEvent.mouseUp(window);

		expect(await screen.findByRole("button", { name: "Define" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Search dictionary" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
	});

	it("does not show the bar for empty selections", async () => {
		selectionSpy.mockReturnValue({
			...fakeSelection(""),
			isCollapsed: true
		} as unknown as Selection);
		render(SelectionMenu);

		fireEvent.mouseUp(window);

		expect(screen.queryByRole("button", { name: "Define" })).not.toBeInTheDocument();
	});

	it("does not show the bar for selections in editable targets", async () => {
		const input = document.createElement("input");
		selectionSpy.mockReturnValue({
			...fakeSelection("abaga"),
			anchorNode: input
		} as unknown as Selection);
		render(SelectionMenu);

		fireEvent.mouseUp(window);

		expect(screen.queryByRole("button", { name: "Define" })).not.toBeInTheDocument();
	});

	it("copies the selected text", async () => {
		selectionSpy.mockReturnValue(fakeSelection("abaga") as unknown as Selection);
		render(SelectionMenu);

		fireEvent.mouseUp(window);
		fireEvent.click(await screen.findByRole("button", { name: "Copy" }));

		await waitFor(() => {
			expect(copyText).toHaveBeenCalledWith("abaga");
		});
	});

	it("opens the define panel with the selected word", async () => {
		vi.mocked(loadDefinitions).mockResolvedValue(defs);
		selectionSpy.mockReturnValue(fakeSelection("abaga") as unknown as Selection);
		const { container } = render(SelectionMenu);

		fireEvent.mouseUp(window);
		fireEvent.click(await screen.findByRole("button", { name: "Define" }));

		expect(await screen.findByText("shoulder")).toBeInTheDocument();
		expect(container.querySelector('button[aria-label="Close"]')).not.toBeNull();
	});

	it("dispatches an iloko:search event with the selected text", async () => {
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");
		selectionSpy.mockReturnValue(fakeSelection("abaga") as unknown as Selection);
		render(SelectionMenu);

		fireEvent.mouseUp(window);
		fireEvent.click(await screen.findByRole("button", { name: "Search dictionary" }));

		const searchEvent = dispatchSpy.mock.calls.find(
			([event]) => (event as CustomEvent<string>).type === "iloko:search"
		);
		expect(searchEvent).toBeDefined();
		expect((searchEvent![0] as CustomEvent<string>).detail).toBe("abaga");
	});

	it("falls back to copying when Web Share is unavailable", async () => {
		selectionSpy.mockReturnValue(fakeSelection("abaga") as unknown as Selection);
		render(SelectionMenu);

		fireEvent.mouseUp(window);
		fireEvent.click(await screen.findByRole("button", { name: "Share" }));

		await waitFor(() => {
			expect(copyText).toHaveBeenCalledWith("abaga");
		});
	});

	it("uses the Web Share API when available", async () => {
		const share = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "share", { value: share, configurable: true });
		selectionSpy.mockReturnValue(fakeSelection("abaga") as unknown as Selection);
		render(SelectionMenu);

		fireEvent.mouseUp(window);
		fireEvent.click(await screen.findByRole("button", { name: "Share" }));

		await waitFor(() => {
			expect(share).toHaveBeenCalledWith(expect.objectContaining({ text: "abaga" }));
		});
		expect(copyText).not.toHaveBeenCalled();
		delete (navigator as { share?: unknown }).share;
	});

	it("closes the menu on Escape", async () => {
		selectionSpy.mockReturnValue(fakeSelection("abaga") as unknown as Selection);
		render(SelectionMenu);

		fireEvent.mouseUp(window);
		expect(await screen.findByRole("button", { name: "Define" })).toBeInTheDocument();

		fireEvent.keyDown(window, { key: "Escape" });

		expect(screen.queryByRole("button", { name: "Define" })).not.toBeInTheDocument();
	});
});
