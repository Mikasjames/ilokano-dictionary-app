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
	const version = __APP_VERSION__;

	const RECENTS_KEY = "iloko-recents";
	const RECENTS_MAX = 10;

	let searchTerm = $state("");
	let results: [string, Definition[]][] = $state([]);
	let totalResults = $state(0);
	let isLoading = $state(false);
	let noResultsFound = $state(false);
	let error: string | null = $state(null);
	let recents = $state<string[]>([]);

	onMount(() => {
		recents = loadRecents();
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

	function loadRecents(): string[] {
		if (!browser) return [];
		try {
			const raw = localStorage.getItem(RECENTS_KEY);
			return raw ? (JSON.parse(raw) as string[]) : [];
		} catch {
			return [];
		}
	}

	function saveRecents(words: string[]) {
		if (!browser) return;
		try {
			localStorage.setItem(RECENTS_KEY, JSON.stringify(words));
		} catch {
			// storage unavailable
		}
	}

	function addRecent(word: string) {
		const next = [word, ...recents.filter((w) => w !== word)].slice(0, RECENTS_MAX);
		recents = next;
		saveRecents(next);
	}

	function clearRecents() {
		recents = [];
		saveRecents([]);
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
		addRecent(word);
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
			const term = searchTerm.toLowerCase().trim();

			// Search both fields: Ilokano headword OR English definition preview
			const matches = Object.entries(index).filter(([word, [, preview]]) => {
				const normalizedWord = word.startsWith("-")
					? word.slice(1).toLowerCase()
					: word.toLowerCase();

				return normalizedWord.includes(term) || preview.toLowerCase().includes(term);
			});

			// Sort based on match quality
			matches.sort((a, b) => {
				const [wordA, [, previewA]] = a;
				const [wordB, [, previewB]] = b;

				const normA = wordA.startsWith("-") ? wordA.slice(1).toLowerCase() : wordA.toLowerCase();
				const normB = wordB.startsWith("-") ? wordB.slice(1).toLowerCase() : wordB.toLowerCase();

				const previewALower = previewA.toLowerCase();
				const previewBLower = previewB.toLowerCase();

				// Assign relevancy scores to prioritize direct matches
				const getScore = (word: string, preview: string) => {
					if (word === term) return 4; // Exact Ilokano match
					if (word.startsWith(term)) return 3; // Ilokano starts with term
					if (word.includes(term)) return 2; // Ilokano contains term
					if (preview.includes(term)) return 1; // Matches only English definition
					return 0;
				};

				const scoreA = getScore(normA, previewALower);
				const scoreB = getScore(normB, previewBLower);

				if (scoreA !== scoreB) {
					return scoreB - scoreA; // Higher score comes first
				}

				return normA.localeCompare(normB); // Fallback to alphabetical sorting
			});

			totalResults = matches.length;
			results = matches.slice(0, 20).map(([word, [, preview]]) => {
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
