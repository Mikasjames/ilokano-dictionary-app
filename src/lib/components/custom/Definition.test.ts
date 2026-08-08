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

vi.mock("svelte-sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() }
}));

import { copyText } from "$lib/clipboard";
import { toast } from "svelte-sonner";

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
	vi.mocked(toast.success).mockClear();
	vi.mocked(toast.error).mockClear();
});

const defsWithExamples: DefinitionType[] = [
	{
		part_of_speech: "n.",
		definition: "a loincloth",
		examples: [
			{
				root: "abag",
				derivative: "abag-aban",
				definition: "to wear a loincloth",
				ilok_example: "Nagabag-aban isuna.",
				eng_example: "He wore a loincloth."
			}
		]
	}
];

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
		expect(toast.success).toHaveBeenCalledWith("Link copied to clipboard");
	});

	it("shows an error toast when copying the link fails", async () => {
		vi.mocked(copyText).mockRejectedValueOnce(new Error("denied"));
		render(Definition, { word: "abaga", definitions: defs });

		fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Could not copy link");
		});
	});

	it("does nothing when copying with no word", async () => {
		render(Definition, { word: null, definitions: defs });

		fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

		await waitFor(() => {
			expect(copyText).not.toHaveBeenCalled();
			expect(toast.success).not.toHaveBeenCalled();
		});
	});

	it("shares via the Web Share API when available", async () => {
		const share = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "share", { value: share, configurable: true });
		render(Definition, { word: "abaga", definitions: defs });

		fireEvent.click(screen.getByRole("button", { name: "Share" }));

		await waitFor(() => {
			expect(share).toHaveBeenCalledWith(
				expect.objectContaining({ url: expect.stringContaining("?word=abaga") })
			);
		});
		expect(copyText).not.toHaveBeenCalled();
		delete (navigator as { share?: unknown }).share;
	});

	it("ignores a rejected share dialog without an error toast", async () => {
		Object.defineProperty(navigator, "share", {
			value: vi.fn().mockRejectedValue(new Error("aborted")),
			configurable: true
		});
		render(Definition, { word: "abaga", definitions: defs });

		fireEvent.click(screen.getByRole("button", { name: "Share" }));

		await waitFor(() => {
			expect(toast.error).not.toHaveBeenCalled();
		});
		delete (navigator as { share?: unknown }).share;
	});

	it("falls back to copying when Web Share is unavailable", async () => {
		render(Definition, { word: "abaga", definitions: defs });

		fireEvent.click(screen.getByRole("button", { name: "Share" }));

		await waitFor(() => {
			expect(copyText).toHaveBeenCalledWith(expect.stringContaining("?word=abaga"));
		});
		expect(toast.success).toHaveBeenCalledWith("Link copied to clipboard");
	});

	it("does nothing when sharing with no word", async () => {
		render(Definition, { word: null, definitions: defs });

		fireEvent.click(screen.getByRole("button", { name: "Share" }));

		await waitFor(() => {
			expect(copyText).not.toHaveBeenCalled();
		});
	});

	it("renders derivatives and examples with their root forms", () => {
		render(Definition, { word: "abag", definitions: defsWithExamples });

		expect(screen.getByText("Derivatives & Examples")).toBeInTheDocument();
		expect(screen.getByText(/abag → abag-aban/)).toBeInTheDocument();
		expect(screen.getByText("to wear a loincloth")).toBeInTheDocument();
		expect(screen.getByText(/Nagabag-aban isuna/)).toBeInTheDocument();
		expect(screen.getByText("He wore a loincloth.")).toBeInTheDocument();
	});

	it("renders a minimal definition with only the headword", () => {
		render(Definition, {
			word: "abel",
			definitions: [{ part_of_speech: "n.", definition: "plain, simple" }]
		});

		expect(screen.getByRole("heading", { name: "abel" })).toBeInTheDocument();
		expect(screen.getByText("noun")).toBeInTheDocument();
		expect(screen.getByText("plain, simple")).toBeInTheDocument();
		expect(screen.queryByText("Examples")).not.toBeInTheDocument();
	});

	it("omits the Definition section when a def has no definition text", () => {
		render(Definition, {
			word: "abalayan",
			definitions: [{ part_of_speech: "v.", ilok_example: "Agabalayan kami." }]
		});

		expect(screen.getByText("verb")).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "Definition" })).not.toBeInTheDocument();
		expect(screen.getByText(/Agabalayan kami/)).toBeInTheDocument();
	});

	it("renders conjugation and origin metadata", () => {
		render(Definition, { word: "abaga", definitions: defs });

		expect(screen.getByText(/mag • noun/)).toBeInTheDocument();
		expect(screen.getByText("(Sanskrit)")).toBeInTheDocument();
	});

	it("renders defs without the headword when word is undefined", () => {
		render(Definition, { word: undefined, definitions: defs });

		expect(screen.getByText("shoulder")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "" })).toBeInTheDocument();
	});
});
