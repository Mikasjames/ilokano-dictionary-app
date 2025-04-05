<script lang="ts">
	import Definition from "$lib/components/custom/Definition.svelte";
	import { fly } from "svelte/transition";

	export let data;
	$: ({ word } = data);

	const duration = 400;
</script>

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
