<script lang="ts">
	import Definition from "$lib/components/custom/Definition.svelte";

	export let data;

	$: ({ word } = data);
</script>

<Definition {word} />
