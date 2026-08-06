<script>
	import { Toaster } from "$lib/components/ui/sonner";
	import { ModeWatcher } from "mode-watcher";
	import SelectionMenu from "$lib/components/custom/SelectionMenu.svelte";
	import "../app.css";

	let { children } = $props();
</script>

<ModeWatcher />
<Toaster position="top-right" />
<SelectionMenu />
{@render children()}
