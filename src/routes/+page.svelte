<script lang="ts">
	import { page } from "$app/stores";
	import type { Definition as DefinitionType } from "$lib/types/types";
	import Search from "$lib/components/custom/Search.svelte";
	import WordOfTheDay from "$lib/components/custom/WordOfTheDay.svelte";
	import Definition from "$lib/components/custom/Definition.svelte";
	import { loadDefinitions } from "$lib/dictionary.js";
	import { fly } from "svelte/transition";

	let selectedWord = $state<string | null>(null);
	let definitions = $state<DefinitionType[]>([]);
	const duration = 400;

	$effect(() => {
		const wordParam = $page.url.searchParams.get("word");
		if (wordParam) {
			selectedWord = wordParam;
			loadDefinitions(wordParam).then((defs) => (definitions = defs));
		} else {
			selectedWord = null;
			definitions = [];
		}
	});
</script>

<div class="max-w-3xl mx-auto p-4 space-y-4">
	<Search />
	<WordOfTheDay />
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
