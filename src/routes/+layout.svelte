<script>
	import Search from "$lib/components/custom/Search.svelte";
	let { children } = $props();
	import "../app.css";
</script>

<div class="max-w-3xl mx-auto p-4 space-y-4">
	<Search />
	{@render children()}
</div>
