<script lang="ts">
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button/index.js";
	import { wordOfTheDay, randomWord, loadSearchIndex, wordUrl } from "$lib/dictionary.js";

	let word = $state<string | null>(null);
	let preview = $state<string | null>(null);

	async function pick(picker: () => Promise<string | null>) {
		const picked = await picker();
		if (picked === null) return;
		const index = await loadSearchIndex();
		word = picked;
		preview = index[picked]?.[1] ?? null;
	}

	$effect(() => {
		pick(wordOfTheDay);
	});
</script>

{#if word}
	<Card class="w-full">
		<CardContent class="flex items-center justify-between gap-4 py-4">
			<div class="min-w-0">
				<p class="text-xs uppercase tracking-wide text-muted-foreground">Word of the day</p>
				<a href={wordUrl(word)} class="text-2xl font-bold hover:underline">{word}</a>
				{#if preview}
					<p class="text-sm text-muted-foreground mt-1 truncate">{preview}</p>
				{/if}
			</div>
			<Button variant="outline" onclick={() => pick(randomWord)} class="shrink-0">Random</Button>
		</CardContent>
	</Card>
{/if}
