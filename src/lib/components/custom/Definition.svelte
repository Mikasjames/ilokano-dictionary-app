<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from "$lib/components/ui/card";
	import { Separator } from "$lib/components/ui/separator";
	import { Badge } from "$lib/components/ui/badge";
	import { getPartsOfSpeech } from "$lib/utils";
	import type { Definition } from "$lib/types/types";

	let { word }: { word: string | null | undefined } = $props();

	let definitions: Definition[] = $state([]);

	async function loadWord(word: string | null | undefined) {
		if (!word) {
			definitions = [];
			return;
		}

		const letter = word.charAt(0).toUpperCase();
		const dict = await import(`$lib/${letter}.json`);
		const def: Record<string, Definition[]> = dict.default;

		definitions = def[word];
	}

	$effect(() => {
		loadWord(word);
	});
</script>

<div class="space-y-4">
	{#each definitions as def}
		<Card class="w-full">
			<CardHeader>
				<div class="flex justify-between items-center">
					<div>
						<CardTitle class="text-3xl font-bold">{word}</CardTitle>
						<CardDescription
							>{`${def.conjugation ? def.conjugation + " • " : ""}`}{getPartsOfSpeech(
								def.part_of_speech
							)}</CardDescription
						>
					</div>
				</div>
			</CardHeader>

			<CardContent class="space-y-6">
				<div>
					<h3 class="text-lg font-medium mb-2">Definition</h3>
					<div class="bg-muted/50 p-4 rounded-md">
						<p class="text-lg">{def.definition}</p>
					</div>
				</div>

				{#if def.ilok_example || def.eng_example}
					<Separator />
					<div>
						<h3 class="text-lg font-medium mb-2">Examples</h3>
						<ul class="list-disc ml-6 space-y-2">
							<li>{def.ilok_example}</li>
							<li>{def.eng_example}</li>
						</ul>
					</div>
				{/if}

				{#if def.synonyms}
					<Separator />
					<div>
						<h3 class="text-lg font-medium mb-2">Synonyms</h3>
						<div class="flex flex-wrap gap-2">
							{#each def.synonyms as synonym}
								<Badge class="cursor-pointer">{synonym}</Badge>
							{/each}
						</div>
					</div>
				{/if}

				{#if def.antonyms}
					<Separator />
					<div>
						<h3 class="text-lg font-medium mb-2">Antonyms</h3>
						<div class="flex flex-wrap gap-2">
							{#each def.antonyms as antonym}
								<Badge class="cursor-pointer">{antonym}</Badge>
							{/each}
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>
	{/each}
</div>
