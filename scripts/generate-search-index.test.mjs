import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { letterOf, previewOf, buildIndex, PREVIEW_MAX_LENGTH } from "./generate-search-index.mjs";

const LIB_DIR = join(process.cwd(), "src", "lib");
const INDEX = JSON.parse(readFileSync(join(LIB_DIR, "search-index.json"), "utf8"));

describe("letterOf", () => {
	it("returns the uppercase first letter", () => {
		expect(letterOf("abaga")).toBe("A");
		expect(letterOf("Balay")).toBe("B");
	});

	it("strips a leading hyphen before taking the letter", () => {
		expect(letterOf("-sabong")).toBe("S");
	});
});

describe("previewOf", () => {
	it("returns an empty string for missing or empty definitions", () => {
		expect(previewOf(undefined)).toBe("");
		expect(previewOf(null)).toBe("");
		expect(previewOf([])).toBe("");
	});

	it("returns an empty string for malformed definitions", () => {
		expect(previewOf([null])).toBe("");
		expect(previewOf(["not-an-object"])).toBe("");
		expect(previewOf([{ definition: 42 }])).toBe("");
	});

	it("uses the first definition, capped at PREVIEW_MAX_LENGTH", () => {
		expect(previewOf([{ definition: "a house" }])).toBe("a house");
		const long = "x".repeat(PREVIEW_MAX_LENGTH + 20);
		expect(previewOf([{ definition: long }])).toHaveLength(PREVIEW_MAX_LENGTH);
	});
});

describe("buildIndex", () => {
	let dir;
	beforeAll(() => {
		dir = mkdtempSync(join(tmpdir(), "iloko-index-"));
		writeFileSync(
			join(dir, "A.json"),
			JSON.stringify({
				abaga: [{ definition: "shoulder; the joint" }],
				"-sabong": [{ definition: "flower" }],
				atok: []
			})
		);
		writeFileSync(join(dir, "B.json"), JSON.stringify({ balay: [{ definition: "house" }] }));
		writeFileSync(join(dir, "README.md"), "not a letter file");
	});
	afterAll(() => rmSync(dir, { recursive: true, force: true }));

	it("builds one entry per word with its letter and preview", () => {
		const index = buildIndex(dir);
		expect(index.abaga).toEqual(["A", "shoulder; the joint"]);
		expect(index["-sabong"]).toEqual(["S", "flower"]);
		expect(index.balay).toEqual(["B", "house"]);
	});

	it("uses an empty preview when a word has no definitions", () => {
		expect(buildIndex(dir).atok).toEqual(["A", ""]);
	});

	it("ignores non-letter files", () => {
		expect(Object.keys(buildIndex(dir))).not.toContain("README.md");
	});
});

describe("search-index.json", () => {
	it("has an entry for every word across all letter files", () => {
		let wordCount = 0;
		for (const file of readdirSync(LIB_DIR).filter((f) => /^[A-Z]\.json$/.test(f))) {
			const data = JSON.parse(readFileSync(join(LIB_DIR, file), "utf8"));
			for (const word of Object.keys(data)) {
				expect(INDEX).toHaveProperty(word);
				wordCount += 1;
			}
		}
		expect(Object.keys(INDEX).length).toBe(wordCount);
	});

	it("indexes every word under its correct letter", () => {
		for (const [word, [letter]] of Object.entries(INDEX)) {
			expect(letter).toBe(letterOf(word));
		}
	});

	it("uses the first definition as the preview", () => {
		for (const file of ["A.json", "B.json", "K.json"]) {
			const data = JSON.parse(readFileSync(join(LIB_DIR, file), "utf8"));
			const firstWord = Object.keys(data)[0];
			const defs = data[firstWord];
			const expected = defs[0]?.definition?.slice(0, 100) ?? "";
			expect(INDEX[firstWord][1]).toBe(expected);
		}
	});

	it("is sorted by word for a letter", () => {
		const words = Object.entries(INDEX)
			.filter(([, [letter]]) => letter === "A")
			.map(([word]) => word)
			.sort();
		expect(words).toEqual(words);
	});
});
