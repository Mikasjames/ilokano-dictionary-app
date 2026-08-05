<script lang="ts">
	import { page } from "$app/stores";
	import type { Definition as DefinitionType } from "$lib/types/types";
	import Search from "$lib/components/custom/Search.svelte";
	import Definition from "$lib/components/custom/Definition.svelte";
	import { fly } from "svelte/transition";

	const dicts = import.meta.glob<{ default: Record<string, DefinitionType[]> }>("../lib/*.json");

	let selectedWord = $state<string | null>(null);
	let definitions = $state<DefinitionType[]>([]);
	const duration = 400;

	$effect(() => {
		const wordParam = $page.url.searchParams.get("word");
		if (wordParam) {
			selectedWord = wordParam;
			loadDefinitions(wordParam);
		} else {
			selectedWord = null;
			definitions = [];
		}
	});

	function findCaseInsensitive(dict: Record<string, DefinitionType[]>, word: string) {
		const lower = word.toLowerCase();
		const key = Object.keys(dict).find((k) => k.toLowerCase() === lower);
		return key ? dict[key] : null;
	}

	async function loadDefinitions(wordToLoad: string) {
		try {
			const letter = (wordToLoad.startsWith("-") ? wordToLoad[1] : wordToLoad[0]).toUpperCase();
			const loader = dicts[`../lib/${letter}.json`];
			if (!loader) {
				definitions = [];
				return;
			}

			const dict = (await loader()).default;
			definitions = dict[wordToLoad] ?? findCaseInsensitive(dict, wordToLoad) ?? [];
		} catch (err) {
			console.error("Failed to load word definition:", err);
			definitions = [];
		}
	}
</script>

<div class="max-w-3xl mx-auto p-4 space-y-4">
	<Search />
	{#key selectedWord}
		<div
			in:fly={{
				delay: duration,
				x: 20,
				duration
			}}
			out:fly={{
				x: -20,
				duration: duration
			}}
		>
			<Definition word={selectedWord} {definitions} />
		</div>
	{/key}
</div>
