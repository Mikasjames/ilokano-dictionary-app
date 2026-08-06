import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const LIB_DIR = join(process.cwd(), "src", "lib");
const INDEX = JSON.parse(readFileSync(join(LIB_DIR, "search-index.json"), "utf8"));

function letterOf(word) {
	return (word.startsWith("-") ? word[1] : word[0]).toUpperCase();
}

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
