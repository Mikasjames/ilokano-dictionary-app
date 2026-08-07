// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import WordOfTheDay from "./WordOfTheDay.svelte";

vi.mock("$lib/dictionary", () => ({
	wordOfTheDay: vi.fn().mockResolvedValue("abalayan"),
	randomWord: vi.fn().mockResolvedValue("abel"),
	loadSearchIndex: vi.fn().mockResolvedValue({
		abalayan: ["A", "a sieve; anything that will let some things pass"],
		abel: ["A", "plain, simple"]
	}),
	wordUrl: vi.fn((word: string) => `/?word=${encodeURIComponent(word)}`)
}));

describe("WordOfTheDay", () => {
	it("renders the word and its preview", async () => {
		render(WordOfTheDay);

		expect(await screen.findByText("abalayan")).toBeInTheDocument();
		expect(
			screen.getByText("a sieve; anything that will let some things pass")
		).toBeInTheDocument();
	});

	it("links to the word's page", async () => {
		render(WordOfTheDay);

		const link = (await screen.findByText("abalayan")).closest("a");
		expect(link).toHaveAttribute("href", "/?word=abalayan");
	});
});
