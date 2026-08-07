import { isEditableTarget } from "./utils";

export const MAX_SELECTION_LENGTH = 120;

export function normalizeSelectionText(text: string): string {
	const trimmed = text.replace(/\s+/g, " ").trim();
	return trimmed.length > MAX_SELECTION_LENGTH ? trimmed.slice(0, MAX_SELECTION_LENGTH) : trimmed;
}

export function selectionAnchor(selection: Selection): DOMRect | null {
	if (!selection || selection.rangeCount === 0) return null;
	const range = selection.getRangeAt(0);
	const rects = range.getClientRects();
	if (rects.length > 0) return rects[0];
	const rect = range.getBoundingClientRect();
	if (rect && (rect.width > 0 || rect.height > 0)) return rect;
	return null;
}

export function virtualElementFor(rect: DOMRect): { getBoundingClientRect(): DOMRect } {
	return { getBoundingClientRect: () => rect };
}

export function selectionIsEditable(selection: Selection): boolean {
	const node = selection.anchorNode;
	if (!node) return true;
	return isEditableTarget(node instanceof Element ? node : node.parentElement);
}

export function selectionInsideRoot(selection: Selection, root: Element | null): boolean {
	const node = selection.anchorNode;
	if (!node || !root) return false;
	return root.contains(node instanceof Element ? node : node.parentElement);
}

export function selectionText(selection: Selection): string {
	return selection.isCollapsed ? "" : normalizeSelectionText(selection.toString());
}

export interface SelectionSnapshot {
	text: string;
	anchor: DOMRect | null;
	editable: boolean;
	insideRoot: boolean;
}

export function selectionSnapshot(
	selection: Selection | null,
	root: Element | null
): SelectionSnapshot | null {
	if (!selection) return null;
	return {
		text: selectionText(selection),
		anchor: selectionAnchor(selection),
		editable: selectionIsEditable(selection),
		insideRoot: selectionInsideRoot(selection, root)
	};
}

export type MenuMode = "select" | "refresh";

export type MenuAction =
	| { action: "show"; text: string; anchor: DOMRect }
	| { action: "refresh-anchor"; anchor: DOMRect }
	| { action: "close" }
	| { action: "none" };

export function decideMenuAction(
	snapshot: SelectionSnapshot | null,
	current: { panelOpen: boolean; panelWord: string | null },
	mode: MenuMode = "select"
): MenuAction {
	if (!snapshot || snapshot.editable || snapshot.insideRoot) return { action: "none" };
	if (!snapshot.text) return current.panelOpen ? { action: "none" } : { action: "close" };

	if (mode === "refresh") {
		return snapshot.anchor
			? { action: "refresh-anchor", anchor: snapshot.anchor }
			: { action: "none" };
	}

	if (current.panelOpen && current.panelWord && snapshot.text === current.panelWord) {
		return { action: "none" };
	}
	if (!snapshot.anchor) return { action: "none" };
	return { action: "show", text: snapshot.text, anchor: snapshot.anchor };
}
