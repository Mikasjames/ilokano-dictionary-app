<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button/index";

	const base = import.meta.env.BASE_URL;

	let { data } = $props();
</script>

<div class="max-w-3xl mx-auto p-4 space-y-4">
	<Card class="w-full">
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle class="text-2xl font-bold">Browse by Letter</CardTitle>
				<a href={`${base}`} class="text-sm text-muted-foreground hover:underline">Dictionary</a>
			</div>
			<CardDescription>Explore words alphabetically</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
				{#each data.letters as letter (letter)}
					<a href={`${base}browse/${letter}/`}>
						<Button variant="outline" class="w-full justify-between">
							<span class="font-semibold">{letter}</span>
							<span class="text-muted-foreground">{data.counts[letter]}</span>
						</Button>
					</a>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>
