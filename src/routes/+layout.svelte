<script>
	import { Toaster } from "$lib/components/ui/sonner";
	import { ModeWatcher } from "mode-watcher";
	import "../app.css";

	let { children } = $props();
</script>

<ModeWatcher />
<Toaster position="top-right" />
{@render children()}
