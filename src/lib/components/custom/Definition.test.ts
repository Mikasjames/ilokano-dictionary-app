// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import Definition from "./Definition.svelte";
import type { Definition as DefinitionType } from "$lib/types/types";

vi.mock("$lib/dictionary", () => ({
	wordUrl: (word: string) => `/?word=${encodeURIComponent(word)}`
}));

vi.mock("$lib/clipboard", () => ({
	copyText: vi.fn().mockResolvedValue(undefined)
}));

import { copyText } from "$lib/clipboard";

const defs: DefinitionType[] = [
	{
		part_of_speech: "n.",
		definition: "shoulder",
		eng_example: "His shoulder hurt.",
		ilok_example: "Nasakit ti abagana.",
		conjugation: "mag",
		origin: "Sanskrit",
		phrases: [{ phrase: "abaga ti daga", definition: "horizon" }],
		synonyms: ["takut, kurtap."],
		antonyms: ["saan"],
		cross_references: ["takleng"],
		variations: ["abagaan"],
		common_forms: ["umabaga"]
	}
];

beforeEach(() => {
	vi.mocked(copyText).mockClear();
});

describe("Definition", () => {
	it("renders the not-found card when there are no definitions", () => {
		render(Definition, { word: "missingword", definitions: [] });

		expect(screen.getByText(/No entry for the word/)).toHaveTextContent("missingword");
	});

	it("renders the headword, part of speech, and definition", () => {
		render(Definition, { word: "abaga", definitions: defs });

		expect(screen.getByRole("heading", { name: "abaga" })).toBeInTheDocument();
		expect(screen.getByText(/noun/)).toBeInTheDocument();
		expect(screen.getByText("shoulder")).toBeInTheDocument();
	});

	it("renders examples, phrases, and word-list sections", () => {
		render(Definition, { word: "abaga", definitions: defs });

		expect(screen.getByText("Examples")).toBeInTheDocument();
		expect(screen.getByText(/Nasakit ti abagana/)).toBeInTheDocument();
		expect(screen.getByText("His shoulder hurt.")).toBeInTheDocument();

		expect(screen.getByText("Phrases & Idioms")).toBeInTheDocument();
		expect(screen.getByText("abaga ti daga")).toBeInTheDocument();
		expect(screen.getByText("horizon")).toBeInTheDocument();

		expect(screen.getByText("Synonyms")).toBeInTheDocument();
		expect(screen.getByText("takut")).toBeInTheDocument();
		expect(screen.getByText("kurtap")).toBeInTheDocument();
		expect(screen.getByText("Antonyms")).toBeInTheDocument();
		expect(screen.getByText("See Also")).toBeInTheDocument();
		expect(screen.getByText("Variations")).toBeInTheDocument();
		expect(screen.getByText("Common Forms")).toBeInTheDocument();
	});

	it("renders nothing when no word and no definitions", () => {
		const { container } = render(Definition, { word: null, definitions: [] });
		expect(container).not.toHaveTextContent(/No entry for the word/);
		expect(container.querySelector("h3")).toBeNull();
	});

	it("copies a deep link when the copy button is clicked", async () => {
		render(Definition, { word: "abaga", definitions: defs });

		fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

		await waitFor(() => {
			expect(copyText).toHaveBeenCalledOnce();
			expect(copyText).toHaveBeenCalledWith(expect.stringContaining("?word=abaga"));
		});
	});
});
