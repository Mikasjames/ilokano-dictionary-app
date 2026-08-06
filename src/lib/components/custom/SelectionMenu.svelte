<script lang="ts">
	import { browser } from "$app/environment";
	import { toast } from "svelte-sonner";
	import { BookOpen, Copy, Search, Share2 } from "lucide-svelte";
	import { computePosition, autoUpdate, flip, offset, shift, size } from "@floating-ui/dom";
	import { Button } from "$lib/components/ui/button/index";
	import { Separator } from "$lib/components/ui/separator";
	import { copyText } from "$lib/clipboard";
	import {
		normalizeSelectionText,
		isEditableTarget,
		selectionAnchor,
		virtualElementFor
	} from "$lib/selection";
	import DefinePanel from "./DefinePanel.svelte";

	let selectionRoot = $state<HTMLElement | null>(null);
	let barElement = $state<HTMLElement | null>(null);
	let panelElement = $state<HTMLElement | null>(null);

	let selectionText = $state<string | null>(null);
	let anchorRect = $state<DOMRect | null>(null);
	let menuOpen = $state(false);
	let panelOpen = $state(false);
	let panelWord = $state<string | null>(null);
	let isTouch = $state(false);

	const barReference = $derived(anchorRect ? virtualElementFor(anchorRect) : null);

	function selectionIsEditable(selection: Selection): boolean {
		const node = selection.anchorNode;
		if (!node) return true;
		return isEditableTarget(node instanceof Element ? node : node.parentElement);
	}

	function selectionInsideRoot(selection: Selection): boolean {
		const node = selection.anchorNode;
		if (!node || !selectionRoot) return false;
		return selectionRoot.contains(node instanceof Element ? node : node.parentElement);
	}

	function updateFromSelection() {
		if (!browser) return;
		const selection = window.getSelection();
		if (!selection) return;
		if (selectionIsEditable(selection) || selectionInsideRoot(selection)) return;

		const text = selection.isCollapsed ? "" : normalizeSelectionText(selection.toString());
		if (panelOpen && panelWord && text === panelWord) return;
		if (!text) {
			if (!panelOpen) closeAll();
			return;
		}

		const rect = selectionAnchor(selection);
		if (!rect) return;

		panelOpen = false;
		panelWord = null;
		selectionText = text;
		anchorRect = rect;
		menuOpen = true;
	}

	function refreshAnchor() {
		if (!browser) return;
		const selection = window.getSelection();
		if (!selection || selection.isCollapsed) {
			if (!panelOpen) closeAll();
			return;
		}
		if (selectionIsEditable(selection) || selectionInsideRoot(selection)) return;
		const text = normalizeSelectionText(selection.toString());
		if (!text) return;
		const rect = selectionAnchor(selection);
		if (rect) anchorRect = rect;
	}

	let selectionTimeout: ReturnType<typeof setTimeout>;
	function scheduleSelectionUpdate() {
		clearTimeout(selectionTimeout);
		selectionTimeout = setTimeout(updateFromSelection, 50);
	}

	function onMouseUp() {
		updateFromSelection();
	}

	function onTouchEnd() {
		setTimeout(updateFromSelection, 0);
	}

	function onKeyUp() {
		updateFromSelection();
	}

	function onScroll() {
		if (menuOpen || panelOpen) refreshAnchor();
	}

	function onPointerDown(event: PointerEvent) {
		const target = event.target as Node | null;
		if (!target || !selectionRoot?.contains(target)) {
			closeAll();
		}
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape") closeAll();
	}

	function onContextMenu(event: MouseEvent) {
		if (!isTouch) return;
		if (isEditableTarget(event.target)) return;
		event.preventDefault();
	}

	function clearNativeSelection() {
		if (!browser || !isTouch) return;
		window.getSelection()?.removeAllRanges();
	}

	function closeAll() {
		menuOpen = false;
		panelOpen = false;
		panelWord = null;
	}

	function doDefine() {
		if (!selectionText) return;
		panelWord = selectionText;
		panelOpen = true;
		menuOpen = false;
		clearNativeSelection();
	}

	async function doCopy() {
		if (!selectionText) return;
		clearNativeSelection();
		try {
			await copyText(selectionText);
			toast.success("Copied to clipboard");
		} catch {
			toast.error("Could not copy text");
		}
		closeAll();
	}

	function doSearch(term: string) {
		clearNativeSelection();
		closeAll();
		window.dispatchEvent(new CustomEvent<string>("iloko:search", { detail: term }));
	}

	async function doShare() {
		if (!selectionText) return;
		clearNativeSelection();
		const url = window.location.href;
		if (navigator.share) {
			try {
				await navigator.share({ title: "IloCo. — Ilokano Dictionary", text: selectionText, url });
			} catch {
				// user cancelled the share dialog
			}
		} else {
			try {
				await copyText(selectionText);
				toast.success("Copied to clipboard");
			} catch {
				toast.error("Could not copy text");
			}
		}
		closeAll();
	}

	$effect(() => {
		if (!browser) return;
		isTouch = window.matchMedia("(any-pointer: coarse)").matches;
		document.addEventListener("selectionchange", scheduleSelectionUpdate);
		window.addEventListener("mouseup", onMouseUp);
		window.addEventListener("touchend", onTouchEnd);
		window.addEventListener("keyup", onKeyUp);
		window.addEventListener("scroll", onScroll, true);
		window.addEventListener("pointerdown", onPointerDown, true);
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("contextmenu", onContextMenu);
		return () => {
			clearTimeout(selectionTimeout);
			document.removeEventListener("selectionchange", scheduleSelectionUpdate);
			window.removeEventListener("mouseup", onMouseUp);
			window.removeEventListener("touchend", onTouchEnd);
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("scroll", onScroll, true);
			window.removeEventListener("pointerdown", onPointerDown, true);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("contextmenu", onContextMenu);
		};
	});

	$effect(() => {
		if (!browser || !barElement || !barReference || !menuOpen) return;
		const element = barElement;
		const reference = barReference;
		return autoUpdate(reference, element, () => {
			computePosition(reference, element, {
				placement: isTouch ? "bottom" : "top",
				strategy: "fixed",
				middleware: isTouch
					? [offset(12), shift({ padding: 8 })]
					: [offset(8), flip(), shift({ padding: 8 })]
			}).then(({ x, y }) => {
				element.style.left = `${x}px`;
				element.style.top = `${y}px`;
				element.style.visibility = "visible";
			});
		});
	});

	$effect(() => {
		if (!browser || !panelElement || !panelOpen) return;
		const element = panelElement;

		if (isTouch) {
			element.style.left = "0";
			element.style.top = "auto";
			element.style.right = "0";
			element.style.bottom = "12px";
			element.style.width = "100%";
			element.style.maxHeight = "none";
			element.style.visibility = "visible";
			return;
		}

		if (!barReference) return;
		const reference = barReference;
		return autoUpdate(reference, element, () => {
			computePosition(reference, element, {
				placement: "bottom-start",
				strategy: "fixed",
				middleware: [
					offset(8),
					flip(),
					shift({ padding: 8 }),
					size({
						apply({ availableHeight, elements }) {
							elements.floating.style.maxHeight = `${Math.max(160, availableHeight - 8)}px`;
						}
					})
				]
			}).then(({ x, y }) => {
				element.style.left = `${x}px`;
				element.style.top = `${y}px`;
				element.style.visibility = "visible";
			});
		});
	});
</script>

<div bind:this={selectionRoot} class="fixed inset-0 z-50 pointer-events-none" aria-live="polite">
	{#if menuOpen && anchorRect && selectionText && !panelOpen}
		<div
			bind:this={barElement}
			class="pointer-events-auto"
			style="position: fixed; left: 0; top: 0; visibility: hidden;"
		>
			<div
				class="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-lg text-popover-foreground"
			>
				<Button variant="ghost" size="sm" class="gap-1.5" onclick={doDefine} title="Define">
					<BookOpen class="h-4 w-4" />
					Define
				</Button>
				<Separator orientation="vertical" class="h-5 mx-0.5" />
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8"
					onclick={doCopy}
					title="Copy"
					aria-label="Copy"
				>
					<Copy class="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8"
					onclick={() => selectionText && doSearch(selectionText)}
					title="Search dictionary"
					aria-label="Search dictionary"
				>
					<Search class="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8"
					onclick={doShare}
					title="Share"
					aria-label="Share"
				>
					<Share2 class="h-4 w-4" />
				</Button>
			</div>
		</div>
	{/if}

	{#if panelOpen && panelWord}
		<div
			bind:this={panelElement}
			class="pointer-events-auto flex flex-col items-center"
			style="position: fixed; left: 0; top: 0; visibility: hidden;"
		>
			<DefinePanel word={panelWord} onClose={closeAll} onSearch={doSearch} bottomSheet={isTouch} />
		</div>
	{/if}
</div>
