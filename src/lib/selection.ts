export const MAX_SELECTION_LENGTH = 120;

export function isEditableTarget(target: EventTarget | null): boolean {
	if (typeof HTMLElement === "undefined") return false;
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

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
