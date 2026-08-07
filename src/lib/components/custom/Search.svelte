<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from "$lib/components/ui/card";
	import Sun from "lucide-svelte/icons/sun";
	import Moon from "lucide-svelte/icons/moon";
	import { toggleMode } from "mode-watcher";
	import { Button } from "$lib/components/ui/button/index";
	import { toast } from "svelte-sonner";
	import * as Command from "$lib/components/ui/command/index";
	import { browser } from "$app/environment";
	import { Loader2 } from "lucide-svelte";
	import { onMount, onDestroy } from "svelte";
	import type { Definition } from "$lib/types/types";
	import { goto } from "$app/navigation";
	import { loadSearchIndex, wordUrl } from "$lib/dictionary";
	import { searchWords } from "$lib/search";
	import { loadRecents, saveRecents, addRecent, RECENTS_MAX } from "$lib/recents";
	const version = __APP_VERSION__;

	let searchTerm = $state("");
	let results: [string, Definition[]][] = $state([]);
	let totalResults = $state(0);
	let isLoading = $state(false);
	let noResultsFound = $state(false);
	let error: string | null = $state(null);
	let recents = $state<string[]>([]);

	onMount(() => {
		if (browser) recents = loadRecents(localStorage);
		window.addEventListener("iloko:search", onExternalSearch);
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener("iloko:search", onExternalSearch);
		}
	});

	function onExternalSearch(event: Event) {
		const term = (event as CustomEvent<string>).detail;
		if (!term) return;
		performSearch(term);
		requestAnimationFrame(() => {
			const input = document.getElementById("search-input");
			input?.scrollIntoView({ behavior: "smooth", block: "center" });
			input?.focus();
		});
	}

	function addRecentWord(word: string) {
		const next = addRecent(recents, word, RECENTS_MAX);
		recents = next;
		if (browser) saveRecents(next, localStorage);
	}

	function clearRecents() {
		recents = [];
		if (browser) saveRecents([], localStorage);
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
			event.preventDefault();
			document.getElementById("search-input")?.focus();
			return;
		}
		if (event.key !== "/") return;
		const target = event.target as HTMLElement | null;
		const tag = target?.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
		event.preventDefault();
		document.getElementById("search-input")?.focus();
	}

	function openWord(word: string) {
		addRecentWord(word);
		searchTerm = "";
		results = [];
		goto(wordUrl(word));
	}

	async function search() {
		if (!browser || !searchTerm.trim()) return;

		isLoading = true;
		error = null;
		noResultsFound = false;
		results = [];
		totalResults = 0;

		try {
			const index = await loadSearchIndex();
			const term = searchTerm.trim();

			const matches = searchWords(index, term);

			totalResults = matches.length;
			results = matches.slice(0, 20).map(([word, preview]) => {
				return [word, [{ definition: preview }]] as [string, Definition[]];
			});

			noResultsFound = results.length === 0;
		} catch (err) {
			console.error("Search error:", err);
			error = err instanceof Error ? err.message : "Search failed";
			toast.error(error);
		} finally {
			isLoading = false;
		}
	}

	let searchTimeout: ReturnType<typeof setTimeout>;

	function performSearch(word: string) {
		searchTerm = word;
		clearTimeout(searchTimeout);
		if (searchTerm.trim()) {
			isLoading = true;
			searchTimeout = setTimeout(() => {
				search();
			}, 300);
		} else {
			results = [];
			totalResults = 0;
			isLoading = false;
			noResultsFound = false;
			error = null;
		}
	}

	function handleItemClick(word: string) {
		openWord(word);
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<Card class="w-full">
	<CardHeader>
		<CardTitle class="text-2xl font-bold text-center flex items-center justify-center gap-2">
			IloCo.
			<span class="text-xs font-normal text-muted-foreground align-super">v{version}</span>
		</CardTitle>
		<CardDescription class="text-center"
			>Your comprehensive digital Ilokano dictionary</CardDescription
		>
		<div class="absolute top-6 right-6 flex items-center space-x-2">
			<Button on:click={toggleMode} variant="outline" size="icon">
				<Sun
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</div>
	</CardHeader>
	<CardContent>
		<div class="flex w-full items-center space-x-2 mb-4">
			<Command.Root shouldFilter={false} class="rounded-lg border shadow-md w-full">
				<div class="flex items-center px-3">
					<Command.Input
						id="search-input"
						placeholder="Type a word to search..."
						bind:value={() => searchTerm, performSearch}
						class="flex-1"
					/>
					{#if isLoading}
						<Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
					{/if}
				</div>

				{#if searchTerm.trim()}
					<Command.List class="max-h-64 overflow-y-auto">
						{#if error}
							<Command.Empty>{error}</Command.Empty>
						{:else if noResultsFound}
							<Command.Empty>No words found for "{searchTerm}"</Command.Empty>
						{:else if results.length > 0}
							{#each results as [word, definitions] (word)}
								<Command.Item
									value={word}
									onSelect={() => handleItemClick(word)}
									class="cursor-pointer hover:bg-accent"
								>
									<div class="flex flex-col">
										<span class="font-medium">{word}</span>
										{#if definitions.length > 0}
											<span class="text-sm text-muted-foreground truncate">
												{definitions[0].definition?.substring(0, 60)}
											</span>
										{/if}
									</div>
								</Command.Item>
							{/each}
						{/if}
					</Command.List>
				{/if}
			</Command.Root>
		</div>

		<div class="text-center text-sm text-muted-foreground">
			{#if results.length > 0}
				<p>
					Found {totalResults} result{totalResults !== 1 ? "s" : ""}
					{#if totalResults > results.length}
						(showing first {results.length})
					{/if}
				</p>
			{/if}
			<a href={`${import.meta.env.BASE_URL}browse/`} class="hover:underline">Browse by letter</a>
		</div>

		{#if recents.length > 0}
			<div class="flex flex-wrap items-center gap-2 mt-4">
				<span class="text-xs text-muted-foreground">Recent:</span>
				{#each recents as recent (recent)}
					<button
						type="button"
						onclick={() => openWord(recent)}
						class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium bg-muted/50 hover:bg-accent transition-colors"
					>
						{recent}
					</button>
				{/each}
				<button
					type="button"
					onclick={clearRecents}
					class="text-xs text-muted-foreground hover:underline ml-auto"
				>
					Clear
				</button>
			</div>
		{/if}
	</CardContent>
</Card>
