import { describe, it, expect } from "vitest";
import type { Definition } from "./types/types";
import { getPartsOfSpeech, processCommasAndDots } from "./utils";

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
