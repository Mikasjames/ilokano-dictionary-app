import { error } from "@sveltejs/kit";
import { wordsByLetter } from "$lib/dictionary";
import searchIndex from "$lib/search-index.json";

export const prerender = true;

const index = searchIndex as unknown as Record<string, [string, string]>;

const letters = [...new Set(Object.values(index).map(([letter]) => letter))].sort();

export const entries = () => letters.map((letter) => ({ letter }));

export const load = ({ params }: { params: { letter: string } }) => {
	if (!letters.includes(params.letter)) {
		throw error(404, `No words starting with "${params.letter}"`);
	}
	return {
		letter: params.letter,
		words: wordsByLetter(index, params.letter)
	};
};
