import { describe, it, expect, beforeAll } from "vitest";
import {
	normalizeSelectionText,
	isEditableTarget,
	selectionAnchor,
	selectionText,
	selectionIsEditable,
	selectionInsideRoot,
	selectionSnapshot,
	decideMenuAction,
	virtualElementFor,
	MAX_SELECTION_LENGTH
} from "./selection";

beforeAll(() => {
	class FakeHTMLElement {
		tagName = "";
		isContentEditable = false;
	}
	(globalThis as Record<string, unknown>).HTMLElement = FakeHTMLElement;
	(globalThis as Record<string, unknown>).Element = FakeHTMLElement;
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

function fakeSelection(
	overrides: Partial<{
		text: string;
		isCollapsed: boolean;
		anchorNode: EventTarget | null;
		hasRects: boolean;
	}> = {}
) {
	const {
		text = "abaga",
		isCollapsed = false,
		anchorNode = fakeElement("P"),
		hasRects = true
	} = overrides;
	const rect = { left: 0, top: 0, width: 10, height: 10 } as DOMRect;
	return {
		rangeCount: 1,
		isCollapsed,
		anchorNode,
		toString: () => text,
		getRangeAt: () => ({
			getClientRects: () => (hasRects ? [rect] : []),
			getBoundingClientRect: () => rect
		})
	} as unknown as Selection;
}

function fakeRoot(contains: boolean): Element {
	return { contains: () => contains } as unknown as Element;
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

describe("selectionText", () => {
	it("returns empty string for collapsed selections", () => {
		expect(selectionText(fakeSelection({ isCollapsed: true }))).toBe("");
	});

	it("normalizes non-collapsed selection text", () => {
		expect(selectionText(fakeSelection({ text: "  abaga  " }))).toBe("abaga");
	});
});

describe("selectionIsEditable", () => {
	it("treats a missing anchor node as editable", () => {
		expect(selectionIsEditable(fakeSelection({ anchorNode: null }))).toBe(true);
	});

	it("flags inputs, textareas, and contenteditable nodes", () => {
		expect(selectionIsEditable(fakeSelection({ anchorNode: fakeElement("INPUT") }))).toBe(true);
		expect(selectionIsEditable(fakeSelection({ anchorNode: fakeElement("TEXTAREA") }))).toBe(true);
		expect(selectionIsEditable(fakeSelection({ anchorNode: fakeElement("DIV", true) }))).toBe(true);
	});

	it("allows plain elements", () => {
		expect(selectionIsEditable(fakeSelection({ anchorNode: fakeElement("P") }))).toBe(false);
	});
});

describe("selectionInsideRoot", () => {
	it("is false without a root or anchor node", () => {
		expect(selectionInsideRoot(fakeSelection(), null)).toBe(false);
		expect(selectionInsideRoot(fakeSelection({ anchorNode: null }), fakeRoot(true))).toBe(false);
	});

	it("reflects whether the root contains the anchor", () => {
		expect(selectionInsideRoot(fakeSelection(), fakeRoot(true))).toBe(true);
		expect(selectionInsideRoot(fakeSelection(), fakeRoot(false))).toBe(false);
	});
});

describe("selectionSnapshot", () => {
	it("returns null without a selection", () => {
		expect(selectionSnapshot(null, null)).toBeNull();
	});

	it("captures text, anchor, and flags", () => {
		const snapshot = selectionSnapshot(fakeSelection(), fakeRoot(false));
		expect(snapshot).not.toBeNull();
		expect(snapshot!.text).toBe("abaga");
		expect(snapshot!.anchor).not.toBeNull();
		expect(snapshot!.editable).toBe(false);
		expect(snapshot!.insideRoot).toBe(false);
	});
});

describe("decideMenuAction", () => {
	const current = { panelOpen: false, panelWord: null };

	it("does nothing for a missing or ignored snapshot", () => {
		expect(decideMenuAction(null, current)).toEqual({ action: "none" });
		expect(
			decideMenuAction({ text: "x", anchor: null, editable: true, insideRoot: false }, current)
		).toEqual({ action: "none" });
		expect(
			decideMenuAction({ text: "x", anchor: null, editable: false, insideRoot: true }, current)
		).toEqual({ action: "none" });
	});

	it("closes the menu for empty selections unless a panel is open", () => {
		const empty = { text: "", anchor: null, editable: false, insideRoot: false };
		expect(decideMenuAction(empty, current)).toEqual({ action: "close" });
		expect(decideMenuAction(empty, { panelOpen: true, panelWord: "abaga" })).toEqual({
			action: "none"
		});
	});

	it("keeps the panel when the same word is re-selected", () => {
		const snapshot = { text: "abaga", anchor: {} as DOMRect, editable: false, insideRoot: false };
		expect(decideMenuAction(snapshot, { panelOpen: true, panelWord: "abaga" })).toEqual({
			action: "none"
		});
	});

	it("does nothing when there is no anchor rect", () => {
		const snapshot = { text: "abaga", anchor: null, editable: false, insideRoot: false };
		expect(decideMenuAction(snapshot, current)).toEqual({ action: "none" });
	});

	it("shows the menu with text and anchor in select mode", () => {
		const anchor = { left: 1 } as DOMRect;
		const snapshot = { text: "abaga", anchor, editable: false, insideRoot: false };
		expect(decideMenuAction(snapshot, current)).toEqual({
			action: "show",
			text: "abaga",
			anchor
		});
	});

	it("refreshes the anchor in refresh mode", () => {
		const anchor = { left: 1 } as DOMRect;
		const snapshot = { text: "abaga", anchor, editable: false, insideRoot: false };
		expect(decideMenuAction(snapshot, current, "refresh")).toEqual({
			action: "refresh-anchor",
			anchor
		});
	});

	it("does nothing in refresh mode without an anchor", () => {
		const snapshot = { text: "abaga", anchor: null, editable: false, insideRoot: false };
		expect(decideMenuAction(snapshot, current, "refresh")).toEqual({ action: "none" });
	});
});
