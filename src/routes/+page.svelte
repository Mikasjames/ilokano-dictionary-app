<script lang="ts">
	import type { PageProps } from "./$types";
	import Definition from "$lib/components/custom/Definition.svelte";
	import Search from "$lib/components/custom/Search.svelte";
	import { fly } from "svelte/transition";

	let { data }: PageProps = $props();

	const duration = 400;
</script>

<div class="max-w-3xl mx-auto p-4 space-y-4">
	<Search />
	{#key data.word}
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
			<Definition word={data.word} />
		</div>
	{/key}
</div>
