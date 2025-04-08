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

	let searchTerm = $state("");
	let results: [string, Definition[]][] = $state([]);
	let isLoading = $state(false);
	let noResultsFound = $state(false);
	let error: string | null = $state(null);

	async function search() {
		if (!browser || !searchTerm.trim()) return;

		isLoading = true;
		error = null;
		noResultsFound = false;

		try {
			const letter = searchTerm.charAt(0).toUpperCase();

			if (!/[A-Z]/.test(letter)) {
				error = "Please enter a word that starts with a letter";
				results = [];
				isLoading = false;
				return;
			}

			const dict = await import(`$lib/${letter}.json`);
			const def: Record<string, Definition[]> = dict.default;

			results = Object.entries(def).filter(([word]) => {
				if (word.startsWith("-")) {
					word = word.slice(1);
				}
				return word.toLowerCase().startsWith(searchTerm.toLowerCase());
			});

			noResultsFound = results.length === 0;
		} catch (error) {
			console.error("Error loading dictionary:", error);
			toast.error("Error loading data. Please try again.");
			results = [];
			error = "Error loading dictionary. Please try again.";
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
