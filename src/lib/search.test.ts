import { describe, it, expect } from "vitest";
import {
	normalizeWord,
	searchWords,
	isFocusSearchShortcut,
	shouldFocusSearchFromKeydown,
	type KeydownEventLike
} from "./search";

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

describe("isFocusSearchShortcut", () => {
	it("accepts Ctrl+K", () => {
		expect(isFocusSearchShortcut({ ctrlKey: true, key: "k" })).toBe(true);
		expect(isFocusSearchShortcut({ ctrlKey: true, key: "K" })).toBe(true);
	});

	it("accepts Meta+K (Cmd+K)", () => {
		expect(isFocusSearchShortcut({ metaKey: true, key: "k" })).toBe(true);
	});

	it("accepts either modifier combined", () => {
		expect(isFocusSearchShortcut({ ctrlKey: true, metaKey: true, key: "k" })).toBe(true);
	});

	it("rejects other keys and unmodified K", () => {
		expect(isFocusSearchShortcut({ key: "k" })).toBe(false);
		expect(isFocusSearchShortcut({ ctrlKey: true, key: "a" })).toBe(false);
		expect(isFocusSearchShortcut({ ctrlKey: true, metaKey: true, key: "/" })).toBe(false);
	});
});

describe("shouldFocusSearchFromKeydown", () => {
	const ev = (overrides: Partial<KeydownEventLike>): KeydownEventLike => ({
		key: "/",
		target: { tagName: "BODY" },
		...overrides
	});

	it("returns true for Ctrl/Cmd+K regardless of target", () => {
		expect(
			shouldFocusSearchFromKeydown(ev({ ctrlKey: true, key: "k", target: { tagName: "INPUT" } }))
		).toBe(true);
		expect(
			shouldFocusSearchFromKeydown(ev({ metaKey: true, key: "K", target: { tagName: "BODY" } }))
		).toBe(true);
	});

	it("returns true for / on non-editable targets", () => {
		expect(shouldFocusSearchFromKeydown(ev({ key: "/" }))).toBe(true);
		expect(shouldFocusSearchFromKeydown(ev({ key: "/", target: null }))).toBe(true);
	});

	it("returns false for / inside inputs", () => {
		expect(shouldFocusSearchFromKeydown(ev({ key: "/", target: { tagName: "INPUT" } }))).toBe(
			false
		);
		expect(shouldFocusSearchFromKeydown(ev({ key: "/", target: { tagName: "TEXTAREA" } }))).toBe(
			false
		);
		expect(
			shouldFocusSearchFromKeydown(ev({ key: "/", target: { isContentEditable: true } }))
		).toBe(false);
	});

	it("returns false for unrelated keys", () => {
		expect(shouldFocusSearchFromKeydown(ev({ key: "a" }))).toBe(false);
		expect(shouldFocusSearchFromKeydown(ev({ key: "Enter" }))).toBe(false);
	});
});
