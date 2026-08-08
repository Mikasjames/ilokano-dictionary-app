// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import type { Definition } from "./types/types";
import { cn, flyAndScale, getPartsOfSpeech, isEditableTarget, processCommasAndDots } from "./utils";

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

describe("cn", () => {
	it("merges class names", () => {
		expect(cn("a", "b")).toBe("a b");
	});

	it("filters falsy inputs", () => {
		const maybe = false;
		expect(cn("a", maybe && "b", null, undefined, 0)).toBe("a");
	});

	it("supports conditional object syntax", () => {
		expect(cn({ active: true, hidden: false }, "base")).toBe("active base");
	});

	it("lets the last tailwind class win on conflicts", () => {
		expect(cn("p-4", "p-6")).toBe("p-6");
	});
});

describe("flyAndScale", () => {
	function computedStyle(transform: string) {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			transform
		} as CSSStyleDeclaration);
	}

	it("uses default duration when called without params", () => {
		computedStyle("");
		const config = flyAndScale(document.createElement("div"));
		expect(config.duration).toBe(150);
		expect(config.delay).toBe(0);
		expect(typeof config.css).toBe("function");
	});

	it("falls back to 200ms when given partial params", () => {
		computedStyle("");
		const config = flyAndScale(document.createElement("div"), { y: 5 });
		expect(config.duration).toBe(200);
	});

	it("honors an explicit duration of zero", () => {
		computedStyle("");
		const config = flyAndScale(document.createElement("div"), { duration: 0 });
		expect(config.duration).toBe(0);
	});

	it("animates from start scale and y-offset to identity", () => {
		computedStyle("");
		const config = flyAndScale(document.createElement("div"), { y: -8, x: 3, start: 0.5, duration: 150 });

		expect(config.css!(0, 0)).toContain("translate3d(3px, -8px, 0) scale(0.5)");
		expect(config.css!(0, 0)).toContain("opacity:0");
		expect(config.css!(1, 0)).toContain("translate3d(0px, 0px, 0) scale(1)");
		expect(config.css!(1, 0)).toContain("opacity:1");
	});

	it("applies the interpolation midpoint correctly", () => {
		computedStyle("");
		const config = flyAndScale(document.createElement("div"), { y: -10, start: 0.8, duration: 150 });

		expect(config.css!(0.5, 0)).toContain("translate3d(0px, -5px, 0) scale(0.9)");
		expect(config.css!(0.5, 0)).toContain("opacity:0.5");
	});

	it("normalizes a computed 'none' transform to an empty string", () => {
		computedStyle("none");
		const config = flyAndScale(document.createElement("div"));
		expect(config.css!(1, 0)).not.toContain("none");
	});

	it("preserves an existing transform on the element", () => {
		computedStyle("rotate(90deg)");
		const config = flyAndScale(document.createElement("div"), { y: 0, start: 1, duration: 150 });

		expect(config.css!(1, 0)).toContain("rotate(90deg)");
	});
});
