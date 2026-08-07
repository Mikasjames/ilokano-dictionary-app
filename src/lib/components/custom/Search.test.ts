// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import Search from "./Search.svelte";
import { RECENTS_KEY } from "$lib/recents";

vi.mock("$lib/dictionary", () => ({
	loadSearchIndex: vi.fn().mockResolvedValue({
		balay: ["B", "house; a dwelling place"],
		abalay: ["A", "to fetch water"],
		nakabalay: ["N", "has a house"]
	}),
	wordUrl: (word: string) => `/?word=${encodeURIComponent(word)}`
}));

import { loadSearchIndex } from "$lib/dictionary";
import { goto } from "$app/navigation";

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
});

describe("Search", () => {
	it("renders the header", () => {
		render(Search);
		expect(screen.getByText(/IloCo/)).toBeInTheDocument();
	});

	it("shows recents from localStorage and clears them", () => {
		localStorage.setItem(RECENTS_KEY, JSON.stringify(["balay", "abaga"]));
		render(Search);

		expect(screen.getByRole("button", { name: "balay" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "abaga" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Clear" }));

		expect(screen.queryByRole("button", { name: "balay" })).not.toBeInTheDocument();
		expect(localStorage.getItem(RECENTS_KEY)).toBe("[]");
	});

	it("does not show recents when storage is empty", () => {
		render(Search);
		expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
	});

	it("searches after an external search event and navigates on select", async () => {
		render(Search);

		window.dispatchEvent(new CustomEvent<string>("iloko:search", { detail: "balay" }));

		const option = await screen.findByRole("option", { name: /^balay/ });
		expect(loadSearchIndex).toHaveBeenCalled();

		fireEvent.click(option);

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith("/?word=balay");
		});
	});

	it("shows a no-results message", async () => {
		vi.mocked(loadSearchIndex).mockResolvedValueOnce({});
		render(Search);

		window.dispatchEvent(new CustomEvent<string>("iloko:search", { detail: "zzz" }));

		await waitFor(() => {
			expect(screen.getByText(/No words found for/)).toBeInTheDocument();
		});
	});
});
