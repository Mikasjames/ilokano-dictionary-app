// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import DefinePanel from "./DefinePanel.svelte";
import type { Definition as DefinitionType } from "$lib/types/types";

vi.mock("$lib/dictionary", () => ({
	loadDefinitions: vi.fn(),
	wordUrl: (word: string) => `/?word=${encodeURIComponent(word)}`
}));

import { loadDefinitions } from "$lib/dictionary";
import { goto } from "$app/navigation";

const def: DefinitionType[] = [
	{
		part_of_speech: "v.",
		definition: "to fetch water",
		ilok_example: "Nagalaak iti danom."
	}
];

beforeEach(() => {
	vi.mocked(goto).mockClear();
});

describe("DefinePanel", () => {
	it("shows a loader then the definition", async () => {
		vi.mocked(loadDefinitions).mockResolvedValue(def);
		render(DefinePanel, { word: "ala", onClose: vi.fn(), onSearch: vi.fn() });

		expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
		expect(await screen.findByText("to fetch water")).toBeInTheDocument();
		expect(screen.getByText("verb")).toBeInTheDocument();
		expect(screen.getByText(/Nagalaak iti danom/)).toBeInTheDocument();
	});

	it("shows the empty state and triggers a search", async () => {
		vi.mocked(loadDefinitions).mockResolvedValue([]);
		const onSearch = vi.fn();
		render(DefinePanel, { word: "zzz", onClose: vi.fn(), onSearch });

		expect(await screen.findByText(/No entry for/)).toHaveTextContent("zzz");
		fireEvent.click(screen.getByRole("button", { name: "Search dictionary" }));
		expect(onSearch).toHaveBeenCalledWith("zzz");
	});

	it("navigates to the full entry", async () => {
		vi.mocked(loadDefinitions).mockResolvedValue(def);
		render(DefinePanel, { word: "ala", onClose: vi.fn(), onSearch: vi.fn() });

		const button = await screen.findByRole("button", { name: /View full entry/ });
		fireEvent.click(button);

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith("/?word=ala");
		});
	});

	it("calls onClose when the close button is clicked", async () => {
		vi.mocked(loadDefinitions).mockResolvedValue(def);
		const onClose = vi.fn();
		render(DefinePanel, { word: "ala", onClose, onSearch: vi.fn() });

		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(onClose).toHaveBeenCalledOnce();
	});
});
