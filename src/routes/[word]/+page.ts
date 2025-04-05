import type { Definition } from "$lib/types/types.js";

export async function load({ params }) {
	const letter = params.word.charAt(0).toUpperCase();
	const dict = await import(`$lib/${letter}.json`);
	const def: Record<string, Definition[]> = dict.default;

	console.log(params.word);
	console.log(dict[params.word]);
	console.log(dict);
	console.log(Object.keys(dict));

	return {
		props: {
			word: params.word,
			definition: def[params.word] || "Not found"
		}
	};
}
