<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { Loader2, Search, ArrowRight, X } from "lucide-svelte";
	import { Button } from "$lib/components/ui/button/index";
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from "$lib/components/ui/card";
	import { Separator } from "$lib/components/ui/separator";
	import { loadDefinitions, wordUrl } from "$lib/dictionary";
	import { getPartsOfSpeech, cn } from "$lib/utils";
	import type { Definition } from "$lib/types/types";

	let {
		word,
		onClose,
		onSearch,
		bottomSheet = false
	}: {
		word: string;
		onClose: () => void;
		onSearch: (word: string) => void;
		bottomSheet?: boolean;
	} = $props();

	let definitions = $state<Definition[]>([]);
	let isLoading = $state(true);

	onMount(() => {
		loadDefinitions(word)
			.then((defs) => (definitions = defs))
			.finally(() => (isLoading = false));
	});

	function viewFullEntry() {
		const target = wordUrl(word);
		onClose();
		goto(target);
	}
</script>

<Card
	class={cn(
		"shadow-xl flex flex-col min-h-0 overflow-hidden",
		bottomSheet ? "w-full max-w-md max-h-[70vh] rounded-b-none" : "w-80 sm:w-96"
	)}
>
	<CardHeader class="pb-3 shrink-0">
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0">
				<CardTitle class="text-xl font-bold truncate">{word}</CardTitle>
				<CardDescription class="text-xs uppercase tracking-wide">Definition</CardDescription>
			</div>
			<Button
				variant="ghost"
				size="icon"
				class="h-7 w-7 shrink-0"
				onclick={onClose}
				aria-label="Close"
			>
				<X class="h-4 w-4" />
			</Button>
		</div>
	</CardHeader>

	<CardContent class="pb-3 flex-1 overflow-y-auto">
		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		{:else if definitions.length === 0}
			<div class="py-4 text-center space-y-3">
				<p class="text-sm text-muted-foreground">
					No entry for "{word}" found.
				</p>
				<Button
					variant="outline"
					size="sm"
					onclick={() => onSearch(word)}
					class="mx-auto inline-flex"
				>
					<Search class="h-4 w-4 mr-2" />
					Search dictionary
				</Button>
			</div>
		{:else}
			<div class="space-y-3">
				{#each definitions as def, i (def.definition)}
					{#if i > 0}
						<Separator />
					{/if}
					<div>
						{#if def.part_of_speech}
							<p class="text-xs uppercase tracking-wide text-primary font-medium mb-1">
								{getPartsOfSpeech(def.part_of_speech)}
							</p>
						{/if}
						{#if def.definition}
							<p class="text-sm leading-relaxed">{def.definition}</p>
						{/if}
						{#if def.ilok_example}
							<p class="text-sm italic font-serif text-muted-foreground mt-1">
								"{def.ilok_example}"
							</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>

	{#if definitions.length > 0}
		<CardFooter class="pt-0 pb-3 shrink-0">
			<Button
				variant="ghost"
				size="sm"
				onclick={viewFullEntry}
				class="w-full justify-between text-muted-foreground"
			>
				View full entry
				<ArrowRight class="h-4 w-4" />
			</Button>
		</CardFooter>
	{/if}
</Card>
