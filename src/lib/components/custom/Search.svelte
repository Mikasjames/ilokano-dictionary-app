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
	import { Button } from "$lib/components/ui/button/index.js";
	import { toast } from "svelte-sonner";
	import * as Command from "$lib/components/ui/command/index.js";
	import { browser } from "$app/environment";
	import { Loader2 } from "lucide-svelte";
	import type { Definition } from "$lib/types/types";
	import { goto } from "$app/navigation";

	const dictCache: Record<string, Record<string, Definition[]>> = {};

	let searchTerm = $state("");
	let results: [string, Definition[]][] = $state([]);
	let isLoading = $state(false);
	let noResultsFound = $state(false);
	let error: string | null = $state(null);

	async function loadDictionary(letter: string): Promise<Record<string, Definition[]>> {
		try {
			if (dictCache[letter]) {
				return dictCache[letter];
			}

			const dict = await import(`$lib/${letter}.json`);
			dictCache[letter] = dict.default;
			return dict.default;
		} catch (err) {
			console.error(`Failed to load dictionary for letter ${letter}:`, err);
			toast.error(`Failed to load dictionary for letter ${letter}. Please try again.`);
			throw new Error(`Dictionary for '${letter}' not found`);
		}
	}

	async function search() {
		if (!browser || !searchTerm.trim()) return;

		isLoading = true;
		error = null;
		noResultsFound = false;
		results = [];

		try {
			const term = searchTerm.toLowerCase().trim();

			const primaryLetter = term.charAt(0).toUpperCase();

			if (!/[A-Z]/.test(primaryLetter)) {
				error = "Please enter a word that starts with a letter";
				isLoading = false;
				return;
			}

			const primaryDict = await loadDictionary(primaryLetter);

			const exactMatches = Object.entries(primaryDict).filter(([word]) => {
				const normalizedWord = word.startsWith("-")
					? word.slice(1).toLowerCase()
					: word.toLowerCase();
				return normalizedWord.startsWith(term);
			});

			results.push(...exactMatches);

			if (exactMatches.length < 5 && term.length >= 3) {
				const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

				for (const letter of alphabet) {
					if (letter === primaryLetter) continue;

					try {
						const dict = await loadDictionary(letter);

						const containsMatches = Object.entries(dict).filter(([word]) => {
							const normalizedWord = word.startsWith("-")
								? word.slice(1).toLowerCase()
								: word.toLowerCase();
							return normalizedWord.includes(term) && !normalizedWord.startsWith(term);
						});

						results.push(...containsMatches.slice(0, 3)); // Limit to 3 results per letter

						if (results.length >= 20) break;
					} catch (err) {
						continue;
					}
				}
			}

			results.sort((a, b) => {
				const wordA = a[0].startsWith("-") ? a[0].slice(1).toLowerCase() : a[0].toLowerCase();
				const wordB = b[0].startsWith("-") ? b[0].slice(1).toLowerCase() : b[0].toLowerCase();

				const aStartsWithTerm = wordA.startsWith(term);
				const bStartsWithTerm = wordB.startsWith(term);

				if (aStartsWithTerm && !bStartsWithTerm) return -1;
				if (!aStartsWithTerm && bStartsWithTerm) return 1;

				return wordA.length - wordB.length;
			});

			results = results.slice(0, 20);
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
			isLoading = false;
			noResultsFound = false;
			error = null;
		}
	}

	function handleItemClick(word: string) {
		const basePath = import.meta.env.BASE_URL;
		goto(`${basePath}?word=${word}`);
		searchTerm = "";
		results = [];
	}
</script>

<Card class="w-full">
	<CardHeader>
		<CardTitle class="text-2xl font-bold text-center">Word Wise</CardTitle>
		<CardDescription class="text-center">Your comprehensive digital dictionary</CardDescription>
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
							{#each results as [word, definitions]}
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
				<p>Found {results.length} result{results.length !== 1 ? "s" : ""}</p>
			{/if}
		</div>
	</CardContent>
</Card>
