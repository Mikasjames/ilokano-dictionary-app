import { describe, it, expect } from "vitest";
import { normalizeWord, searchWords } from "./search";

const index: Record<string, [string, string]> = {
	balay: ["B", "house; a dwelling place"],
	"balay-bintana": ["B", "window"],
	nakabalay: ["N", "has a house"],
	abalay: ["A", "to fetch water; balay"],
	house: ["H", "a building for living; balay"],
	animals: ["A", "creatures in the wild"]
};

describe("normalizeWord", () => {
	it("lowercases and strips a leading hyphen", () => {
		expect(normalizeWord("-Abalayan")).toBe("abalayan");
		expect(normalizeWord("Abalayan")).toBe("abalayan");
	});
});

describe("searchWords", () => {
	it("returns [] for a blank term", () => {
		expect(searchWords(index, "")).toEqual([]);
		expect(searchWords(index, "   ")).toEqual([]);
	});

	it("ranks exact > prefix > contains > English-preview matches", () => {
		expect(searchWords(index, "balay").map(([w]) => w)).toEqual([
			"balay",
			"balay-bintana",
			"abalay",
			"nakabalay",
			"house"
		]);
	});

	it("matches English definition previews as a last resort", () => {
		expect(searchWords(index, "dwelling").map(([w]) => w)).toEqual(["balay"]);
	});

	it("is case-insensitive", () => {
		const lower = searchWords(index, "balay").map(([w]) => w);
		const upper = searchWords(index, "BALAY").map(([w]) => w);
		expect(upper).toEqual(lower);
	});

	it("matches hyphen-prefixed affix entries via their normalized stem", () => {
		const affixIndex: Record<string, [string, string]> = {
			"-sabong": ["S", "flower"],
			sabong: ["S", "flower"]
		};
		expect(
			searchWords(affixIndex, "sabong")
				.map(([w]) => w)
				.sort()
		).toEqual(["-sabong", "sabong"]);
	});

	it("does not match when the query itself carries the hyphen", () => {
		const affixIndex: Record<string, [string, string]> = {
			"-sabong": ["S", "flower"],
			sabong: ["S", "flower"]
		};
		expect(searchWords(affixIndex, "-sabong")).toEqual([]);
	});

	it("returns results in word+preview tuples", () => {
		const results = searchWords(index, "dwelling");
		expect(results[0]).toEqual(["balay", "house; a dwelling place"]);
	});

	it("caps results at the given limit", () => {
		const results = searchWords(index, "a");
		expect(results.length).toBeGreaterThan(3);
		expect(searchWords(index, "a", 3)).toHaveLength(3);
	});

	it("returns [] when nothing matches", () => {
		expect(searchWords(index, "xyzzy")).toEqual([]);
	});
});
