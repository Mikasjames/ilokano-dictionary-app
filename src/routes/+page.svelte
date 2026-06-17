<script lang="ts">
	import { page } from "$app/stores";
	import type { Definition as DefinitionType } from "$lib/types/types";
	import Search from "$lib/components/custom/Search.svelte";
	import Definition from "$lib/components/custom/Definition.svelte";
	import { fly } from "svelte/transition";

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

	async function loadDefinitions(wordToLoad: string) {
		try {
			let letter = wordToLoad.charAt(0).toUpperCase();
			if (letter === "-") {
				letter = wordToLoad.charAt(1).toUpperCase();
			}

			const dict = await import(`../lib/${letter}.json`);
			definitions = dict.default[wordToLoad] || [];
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
