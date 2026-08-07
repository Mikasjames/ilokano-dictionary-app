import { describe, it, expect, vi, afterEach } from "vitest";
import {
	letterOf,
	wordUrl,
	loadDefinitions,
	loadSearchIndex,
	randomWord,
	wordOfTheDay,
	letterCounts,
	wordsByLetter
} from "./dictionary";
import searchIndex from "./search-index.json";
import aJson from "./A.json";

const index = searchIndex as unknown as Record<string, [string, string]>;

afterEach(() => {
	vi.restoreAllMocks();
});

describe("letterOf", () => {
	it("returns the uppercase first letter", () => {
		expect(letterOf("abalayan")).toBe("A");
		expect(letterOf("Balay")).toBe("B");
	});

	it("ignores a leading hyphen for affixes", () => {
		expect(letterOf("-AK")).toBe("A");
		expect(letterOf("-pinnakam")).toBe("P");
	});
});

describe("wordUrl", () => {
	it("builds a deep link with the word query param", () => {
		expect(wordUrl("abalayan")).toBe("/?word=abalayan");
	});

	it("encodes special characters", () => {
		expect(wordUrl("bala-bintana")).toBe("/?word=bala-bintana");
		expect(wordUrl("a b")).toBe("/?word=a%20b");
		expect(wordUrl("ñgato")).toContain("%C3%B1");
	});
});

describe("loadSearchIndex", () => {
	it("loads the full generated index", async () => {
		const loaded = await loadSearchIndex();
		expect(Object.keys(loaded).length).toBe(Object.keys(index).length);
	});

	it("caches the index between calls", async () => {
		const first = await loadSearchIndex();
		const second = await loadSearchIndex();
		expect(second).toBe(first);
	});
});

describe("letterCounts", () => {
	it("counts words per letter from the index", async () => {
		const counts = await letterCounts();
		let total = 0;
		for (const [letter, count] of counts) {
			expect(letter).toMatch(/^[A-Z]$/);
			expect(count).toBeGreaterThan(0);
			total += count;
		}
		expect(total).toBe(Object.keys(index).length);
	});
});

describe("wordsByLetter", () => {
	it("filters to the letter and sorts alphabetically", () => {
		const words = wordsByLetter(index, "A");
		expect(words.length).toBeGreaterThan(0);
		expect(words.every(([w]) => index[w][0] === "A")).toBe(true);
		const sorted = words.map(([w]) => w).sort((a, b) => a.localeCompare(b));
		expect(words.map(([w]) => w)).toEqual(sorted);
	});

	it("returns previews as the second element", () => {
		const words = wordsByLetter(index, "A");
		expect(words[0]).toHaveLength(2);
		expect(typeof words[0][1]).toBe("string");
		expect(words[0][1]).toBe(index[words[0][0]][1]);
	});

	it("returns [] for an empty letter", () => {
		expect(wordsByLetter(index, "Æ")).toEqual([]);
	});
});

describe("wordOfTheDay", () => {
	it("is deterministic for the same date", async () => {
		const date = new Date("2024-01-01T00:00:00Z");
		const first = await wordOfTheDay(date);
		const second = await wordOfTheDay(date);
		expect(first).toBe(second);
	});

	it("returns a word present in the index", async () => {
		const word = await wordOfTheDay(new Date("2026-08-07T00:00:00Z"));
		expect(Object.prototype.hasOwnProperty.call(index, word ?? "")).toBe(true);
	});
});

describe("randomWord", () => {
	it("picks a word from the index", async () => {
		const word = await randomWord();
		expect(Object.prototype.hasOwnProperty.call(index, word ?? "")).toBe(true);
	});

	it("uses Math.random to choose", async () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const firstKey = Object.keys(index)[0];
		await expect(randomWord()).resolves.toBe(firstKey);
	});
});

describe("loadDefinitions", () => {
	const firstWord = Object.keys(aJson)[0];

	it("loads a real entry from the letter file", async () => {
		const defs = await loadDefinitions(firstWord);
		expect(defs.length).toBeGreaterThan(0);
		expect(defs[0]).toHaveProperty("definition");
	});

	it("falls back to a case-insensitive match", async () => {
		const defs = await loadDefinitions(firstWord.toUpperCase());
		expect(defs.length).toBeGreaterThan(0);
	});

	it("returns [] for unknown words", async () => {
		await expect(loadDefinitions("zzz-no-such-word")).resolves.toEqual([]);
	});

	it("returns [] instead of throwing on missing letter files", async () => {
		await expect(loadDefinitions("ñgato")).resolves.toEqual([]);
	});
});
