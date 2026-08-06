<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from "$lib/components/ui/card";
	import { wordUrl } from "$lib/dictionary";

	const base = import.meta.env.BASE_URL;

	let { data } = $props();
</script>

<div class="max-w-3xl mx-auto p-4 space-y-4">
	<Card class="w-full">
		<CardHeader>
			<div class="flex items-center justify-between gap-4">
				<CardTitle class="text-2xl font-bold">Words starting with {data.letter}</CardTitle>
				<a href={`${base}browse/`} class="text-sm text-muted-foreground hover:underline shrink-0"
					>All letters</a
				>
			</div>
			<CardDescription>{data.words.length} word{data.words.length !== 1 ? "s" : ""}</CardDescription
			>
		</CardHeader>
		<CardContent>
			<ul class="divide-y divide-border">
				{#each data.words as [word, preview] (word)}
					<li>
						<a
							href={wordUrl(word)}
							class="flex justify-between gap-4 py-2.5 px-2 rounded hover:bg-accent/50"
						>
							<span class="font-medium shrink-0">{word}</span>
							<span class="text-sm text-muted-foreground truncate text-right">{preview}</span>
						</a>
					</li>
				{/each}
			</ul>
		</CardContent>
	</Card>
</div>
