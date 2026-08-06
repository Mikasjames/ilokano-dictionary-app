import { describe, it, expect, beforeAll } from "vitest";
import {
	normalizeSelectionText,
	isEditableTarget,
	selectionAnchor,
	virtualElementFor,
	MAX_SELECTION_LENGTH
} from "./selection";

beforeAll(() => {
	class FakeHTMLElement {
		tagName = "";
		isContentEditable = false;
	}
	(globalThis as Record<string, unknown>).HTMLElement = FakeHTMLElement;
});

function fakeElement(tag: string, editable = false): EventTarget {
	const ctor = (globalThis as Record<string, unknown>).HTMLElement as new () => object;
	const node = Object.create(ctor.prototype) as {
		tagName: string;
		isContentEditable: boolean;
	};
	node.tagName = tag;
	node.isContentEditable = editable;
	return node as unknown as EventTarget;
}

describe("normalizeSelectionText", () => {
	it("trims surrounding whitespace", () => {
		expect(normalizeSelectionText("  abaga  ")).toBe("abaga");
	});

	it("collapses internal whitespace and newlines", () => {
		expect(normalizeSelectionText("shoulder,\n\n  south wind")).toBe("shoulder, south wind");
	});

	it("returns empty string for blank selections", () => {
		expect(normalizeSelectionText("   ")).toBe("");
	});

	it("caps over-long selections", () => {
		const long = "x".repeat(MAX_SELECTION_LENGTH + 50);
		const result = normalizeSelectionText(long);
		expect(result.length).toBe(MAX_SELECTION_LENGTH);
	});
});

describe("isEditableTarget", () => {
	it("rejects non-element targets", () => {
		expect(isEditableTarget(null)).toBe(false);
		expect(isEditableTarget(undefined as unknown as EventTarget)).toBe(false);
	});

	it("detects inputs and textareas", () => {
		expect(isEditableTarget(fakeElement("INPUT"))).toBe(true);
		expect(isEditableTarget(fakeElement("TEXTAREA"))).toBe(true);
	});

	it("detects contenteditable elements", () => {
		expect(isEditableTarget(fakeElement("DIV", true))).toBe(true);
	});

	it("allows plain elements", () => {
		expect(isEditableTarget(fakeElement("P"))).toBe(false);
	});
});

describe("selectionAnchor", () => {
	it("returns null for empty selections", () => {
		expect(selectionAnchor(null as unknown as Selection)).toBeNull();
		expect(selectionAnchor({ rangeCount: 0 } as unknown as Selection)).toBeNull();
	});
});

describe("virtualElementFor", () => {
	it("wraps a rect for floating-ui", () => {
		const rect = { left: 0, top: 0, width: 10, height: 10 } as DOMRect;
		expect(virtualElementFor(rect).getBoundingClientRect()).toBe(rect);
	});
});
