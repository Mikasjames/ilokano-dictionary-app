import { letterCounts } from "$lib/dictionary";

export const prerender = true;

export const load = async () => {
	const counts = await letterCounts();
	return {
		letters: [...counts.keys()].sort(),
		counts: Object.fromEntries(counts)
	};
};
