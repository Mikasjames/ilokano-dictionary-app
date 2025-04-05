<script lang="ts">
	import Definition from "$lib/components/custom/Definition.svelte";
	import { slide } from "svelte/transition";

	export let data;

	$: ({ word } = data);
</script>

{#key word}
	<div transition:slide={{}}>
		<Definition {word} />
	</div>
{/key}
