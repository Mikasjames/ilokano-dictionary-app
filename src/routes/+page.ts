import type { Definition } from "$lib/types/types";

export async function load({ url }) {
	const word = url.searchParams.get("word");

	if (!word) {
		return {
			word: null,
			definitions: [] as Definition[]
		};
	}

	try {
		let letter = word.charAt(0).toUpperCase();
		if (letter === "-") {
			letter = word.charAt(1).toUpperCase();
		}
		
		// Use a dynamic import to only load the required dictionary chunk
		const dict = await import(`../lib/${letter}.json`);
		const definitions = dict.default[word] || [];
		
		return {
			word,
			definitions
		};
	} catch (err) {
		console.error("Failed to load word definition:", err);
		return {
			word,
			definitions: [] as Definition[]
		};
	}
}
