import type { Definition } from "./types/types";

const dicts = import.meta.glob<{ default: Record<string, Definition[]> }>("./[A-Z].json");

let searchIndex: Record<string, [string, string]> | null = null;

export function wordUrl(word: string): string {
	const basePath = import.meta.env.BASE_URL;
	return `${basePath}?word=${encodeURIComponent(word)}`;
}

export function letterOf(word: string): string {
	return (word.startsWith("-") ? word[1] : word[0]).toUpperCase();
}

function findCaseInsensitive(
	dict: Record<string, Definition[]>,
	word: string
): Definition[] | null {
	const lower = word.toLowerCase();
	const key = Object.keys(dict).find((k) => k.toLowerCase() === lower);
	return key ? dict[key] : null;
}

export async function loadDefinitions(word: string): Promise<Definition[]> {
	try {
		const letter = letterOf(word);
		const loader = dicts[`./${letter}.json`];
		if (!loader) return [];
		const dict = (await loader()).default;
		return dict[word] ?? findCaseInsensitive(dict, word) ?? [];
	} catch (err) {
		console.error("Failed to load word definition:", err);
		return [];
	}
}

export async function loadSearchIndex(): Promise<Record<string, [string, string]>> {
	if (searchIndex) return searchIndex;
	const module = await import("./search-index.json");
	searchIndex = module.default as unknown as Record<string, [string, string]>;
	return searchIndex || {};
}

export async function randomWord(): Promise<string | null> {
	const index = await loadSearchIndex();
	const keys = Object.keys(index);
	if (keys.length === 0) return null;
	return keys[Math.floor(Math.random() * keys.length)];
}

export async function wordOfTheDay(date = new Date()): Promise<string | null> {
	const index = await loadSearchIndex();
	const keys = Object.keys(index);
	if (keys.length === 0) return null;
	const day = Math.floor(date.getTime() / 86_400_000);
	return keys[day % keys.length];
}

export async function letterCounts(): Promise<Map<string, number>> {
	const index = await loadSearchIndex();
	const counts = new Map<string, number>();
	for (const [letter] of Object.values(index)) {
		counts.set(letter, (counts.get(letter) ?? 0) + 1);
	}
	return counts;
}

export function lettersWithWords(counts: Map<string, number>): string[] {
	return [...counts.keys()].sort();
}

export function wordsByLetter(
	index: Record<string, [string, string]>,
	letter: string
): [string, string][] {
	return Object.entries(index)
		.filter(([, [l]]) => l === letter)
		.map(([word, [, preview]]) => [word, preview] as [string, string])
		.sort(([a], [b]) => a.localeCompare(b));
}
