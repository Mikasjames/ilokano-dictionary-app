<script lang="ts">
	import Definition from "$lib/components/custom/Definition.svelte";
	import Search from "$lib/components/custom/Search.svelte";
	import { fly } from "svelte/transition";

	export let data;
	$: ({ word } = data);

	const duration = 400;
</script>

<div class="max-w-3xl mx-auto p-4 space-y-4">
	<Search />
	{#key word}
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
			<Definition {word} />
		</div>
	{/key}
</div>
