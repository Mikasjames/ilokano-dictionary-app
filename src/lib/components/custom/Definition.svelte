<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from "$lib/components/ui/card";
	import { Separator } from "$lib/components/ui/separator";
	import { Button } from "$lib/components/ui/button/index";
	import { getPartsOfSpeech, processCommasAndDots } from "$lib/utils";
	import { toast } from "svelte-sonner";
	import { browser } from "$app/environment";
	import { Link2, Share2 } from "lucide-svelte";
	import { wordUrl } from "$lib/dictionary";
	import { copyText } from "$lib/clipboard";
	import type { Definition } from "$lib/types/types";
	import BadgeWords from "./BadgeWords.svelte";

	let { word, definitions = [] }: { word: string | null | undefined; definitions?: Definition[] } =
		$props();

	// We no longer need to load definitions here as they are provided by the page load function

	function currentUrl(): string {
		return new URL(wordUrl(word ?? ""), window.location.href).href;
	}

	async function copyLink() {
		if (!browser || !word) return;
		try {
			await copyText(currentUrl());
			toast.success("Link copied to clipboard");
		} catch (err) {
			console.error("Failed to copy link:", err);
			toast.error("Could not copy link");
		}
	}

	async function shareWord() {
		if (!browser || !word) return;
		const url = currentUrl();
		if (navigator.share) {
			try {
				await navigator.share({ title: `${word} — IloCo.`, url });
			} catch {
				// user cancelled the share dialog
			}
		} else {
			await copyLink();
		}
	}
</script>

<div class="space-y-4">
	{#if definitions.length === 0 && word}
		<Card class="w-full">
			<CardContent class="text-center">
				No entry for the word "{word}" found.
			</CardContent>
		</Card>
	{:else}
		{#each definitions as def (def.definition)}
			<Card class="w-full">
				<CardHeader>
					<div class="flex justify-between items-center gap-4">
						<div>
							<CardTitle class="text-3xl font-bold">{word}</CardTitle>
							<CardDescription class="mt-1">
								{def.conjugation ? def.conjugation + " • " : ""}
								{getPartsOfSpeech(def.part_of_speech)}
								{#if def.origin}
									<span class="text-muted-foreground italic ml-1">({def.origin})</span>
								{/if}
							</CardDescription>
						</div>
						<div class="flex items-center gap-1 shrink-0">
							<Button variant="ghost" size="icon" onclick={copyLink} aria-label="Copy link">
								<Link2 class="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="icon" onclick={shareWord} aria-label="Share">
								<Share2 class="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent class="space-y-6">
					{#if def.definition}
						<div>
							<h3 class="text-lg font-medium mb-2">Definition</h3>
							<div class="bg-muted/50 p-4 rounded-md">
								<p class="text-lg">{def.definition}</p>
							</div>
						</div>
					{/if}

					{#if def.ilok_example || def.eng_example}
						<Separator />
						<div>
							<h3 class="text-lg font-medium mb-2">Examples</h3>
							<div class="border-l-2 border-primary pl-4 py-1 space-y-1">
								{#if def.ilok_example}
									<p class="text-lg italic font-serif">"{def.ilok_example}"</p>
								{/if}
								{#if def.eng_example}
									<p class="text-muted-foreground">{def.eng_example}</p>
								{/if}
							</div>
						</div>
					{/if}

					{#if def.phrases && def.phrases.length > 0}
						<Separator />
						<div>
							<h3 class="text-lg font-medium mb-3">Phrases & Idioms</h3>
							<div class="grid gap-3 sm:grid-cols-2">
								{#each def.phrases as item (item.phrase)}
									<div class="bg-muted/30 p-3 rounded-md border border-border">
										<p class="font-semibold text-primary">{item.phrase}</p>
										<p class="text-sm text-muted-foreground mt-1">{item.definition}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if def.examples && def.examples.length > 0}
						<Separator />
						<div>
							<h3 class="text-lg font-medium mb-3">Derivatives & Examples</h3>
							<div class="space-y-4">
								{#each def.examples as ex (ex.derivative)}
									<div
										class="p-4 rounded-lg border bg-card text-card-foreground shadow-sm space-y-2"
									>
										<div class="flex flex-wrap items-center gap-2">
											<div
												class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground"
											>
												{ex.root} &rarr; {ex.derivative}
											</div>
											<span class="text-sm font-medium">{ex.definition}</span>
										</div>
										{#if ex.ilok_example || ex.eng_example}
											<div class="border-l-2 border-border pl-3 py-0.5 space-y-1 text-sm">
												{#if ex.ilok_example}
													<p class="italic font-serif">"{ex.ilok_example}"</p>
												{/if}
												{#if ex.eng_example}
													<p class="text-muted-foreground">{ex.eng_example}</p>
												{/if}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if def.common_forms}
						<Separator />
						<BadgeWords title="Common Forms" wordEntries={def.common_forms} />
					{/if}

					{#if def.variations}
						<Separator />
						<BadgeWords title="Variations" wordEntries={def.variations} />
					{/if}

					{#if def.synonyms}
						<Separator />
						<BadgeWords
							title="Synonyms"
							wordEntries={def.synonyms
								? def.synonyms.flatMap((synonym) => processCommasAndDots(synonym))
								: []}
						/>
					{/if}

					{#if def.antonyms}
						<Separator />
						<BadgeWords
							title="Antonyms"
							wordEntries={def.antonyms
								? def.antonyms.flatMap((antonym) => processCommasAndDots(antonym))
								: []}
						/>
					{/if}

					{#if def.cross_references}
						<Separator />
						<BadgeWords
							title="See Also"
							wordEntries={def.cross_references
								? def.cross_references.flatMap((ref) => processCommasAndDots(ref))
								: []}
						/>
					{/if}
				</CardContent>
			</Card>
		{/each}
	{/if}
</div>
