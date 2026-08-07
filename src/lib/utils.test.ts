import { describe, it, expect } from "vitest";
import type { Definition } from "./types/types";
import { getPartsOfSpeech, isEditableTarget, processCommasAndDots } from "./utils";

describe("getPartsOfSpeech", () => {
	it("maps abbreviations to full names", () => {
		expect(getPartsOfSpeech("n.")).toBe("noun");
		expect(getPartsOfSpeech("v.")).toBe("verb");
		expect(getPartsOfSpeech("adj.")).toBe("adjective");
		expect(getPartsOfSpeech("adv.")).toBe("adverb");
		expect(getPartsOfSpeech("interj.")).toBe("interjection");
		expect(getPartsOfSpeech("conj.")).toBe("conjunction");
		expect(getPartsOfSpeech("prep.")).toBe("preposition");
		expect(getPartsOfSpeech("pron.")).toBe("pronoun");
		expect(getPartsOfSpeech("pref.")).toBe("prefix");
		expect(getPartsOfSpeech("suf.")).toBe("suffix");
	});

	it("returns undefined for unknown or missing values", () => {
		const unknown = "x." as Definition["part_of_speech"];
		expect(getPartsOfSpeech(unknown)).toBeUndefined();
		expect(getPartsOfSpeech(undefined)).toBeUndefined();
	});
});

describe("isEditableTarget", () => {
	it("flags input, textarea, and contenteditable targets", () => {
		expect(isEditableTarget({ tagName: "INPUT" })).toBe(true);
		expect(isEditableTarget({ tagName: "textarea" })).toBe(true);
		expect(isEditableTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
	});

	it("is false for plain elements, nullish values, and non-objects", () => {
		expect(isEditableTarget({ tagName: "DIV" })).toBe(false);
		expect(isEditableTarget(null)).toBe(false);
		expect(isEditableTarget(undefined)).toBe(false);
		expect(isEditableTarget("INPUT")).toBe(false);
		expect(isEditableTarget(42)).toBe(false);
	});

	it("ignores malformed tagName values", () => {
		expect(isEditableTarget({ tagName: 42 })).toBe(false);
		expect(isEditableTarget({})).toBe(false);
	});
});

describe("processCommasAndDots", () => {
	it("splits on commas and periods and trims whitespace", () => {
		expect(processCommasAndDots("a, b, c.")).toEqual(["a", "b", "c"]);
		expect(processCommasAndDots("one. two")).toEqual(["one", "two"]);
	});

	it("drops empty segments", () => {
		expect(processCommasAndDots(", ,")).toEqual([]);
		expect(processCommasAndDots("foo,,")).toEqual(["foo"]);
		expect(processCommasAndDots("  ")).toEqual([]);
	});
});
