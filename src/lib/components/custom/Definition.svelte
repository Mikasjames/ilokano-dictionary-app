<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from "$lib/components/ui/card";
	import { Separator } from "$lib/components/ui/separator";
	import { getPartsOfSpeech, processCommasAndDots } from "$lib/utils";
	import type { Definition } from "$lib/types/types";
	import BadgeWords from "./BadgeWords.svelte";

	let { word }: { word: string | null | undefined } = $props();

	let definitions: Definition[] = $state([]);

	async function loadWord(word: string | null | undefined) {
		if (!word) {
			definitions = [];
			return;
		}

		let letter = word.charAt(0).toUpperCase();
		if (letter === "-") {
			letter = word.charAt(1).toUpperCase();
		}
		const dict = await import(`$lib/${letter}.json`);
		const def: Record<string, Definition[]> = dict.default;

		definitions = def[word];
	}

	$effect(() => {
		loadWord(word);
	});
</script>

<div class="space-y-4">
	{#if definitions.length === 0 && word}
		<Card class="w-full">
			<CardContent class="text-center">
				No entry for the word "{word}" found.
			</CardContent>
		</Card>
	{:else}
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
					{#if def.definition}
						<div>
							<h3 class="text-lg font-medium mb-2">Definition</h3>
							<div class="bg-muted/50 p-4 rounded-md">
								<p class="text-lg">{def.definition}</p>
							</div>
						</div>
					{/if}

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

					{#if def.common_forms}
						<Separator />
						<BadgeWords title="Common Forms" wordEntries={def.common_forms} />
					{/if}

					{#if def.variations}
						<Separator />
						<BadgeWords title="Variations" wordEntries={def.variations} />
					{/if}

					{#if def.synonyms}
						<Separator />
						<BadgeWords title="Synonyms"         
							wordEntries={
								def.synonyms
									? def.synonyms.flatMap(synonym => processCommasAndDots(synonym))
									: []
							} 
						/>
					{/if}

					{#if def.antonyms}
						<Separator />
						<BadgeWords title="Antonyms"         
							wordEntries={
								def.antonyms
									? def.antonyms.flatMap(antonym => processCommasAndDots(antonym))
									: []
							} 
						/>
					{/if}
				</CardContent>
			</Card>
		{/each}
	{/if}
</div>
