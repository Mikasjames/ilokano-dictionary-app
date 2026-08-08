// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
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

import { randomWord } from "$lib/dictionary";

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

	it("picks a new random word when the Random button is clicked", async () => {
		render(WordOfTheDay);

		await screen.findByText("abalayan");
		fireEvent.click(screen.getByRole("button", { name: "Random" }));

		expect(randomWord).toHaveBeenCalledOnce();
		await waitFor(() => {
			expect(screen.getByText("abel")).toBeInTheDocument();
			expect(screen.getByText("plain, simple")).toBeInTheDocument();
		});
	});

	it("renders no preview when the picked word has none in the index", async () => {
		vi.mocked(randomWord).mockResolvedValueOnce("ghostword");
		render(WordOfTheDay);

		await screen.findByText("abalayan");
		fireEvent.click(screen.getByRole("button", { name: "Random" }));

		await waitFor(() => {
			expect(screen.getByText("ghostword")).toBeInTheDocument();
			expect(screen.queryByText("plain, simple")).not.toBeInTheDocument();
		});
	});
});
