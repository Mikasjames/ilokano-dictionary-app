export function normalizeWord(word: string): string {
	return word.startsWith("-") ? word.slice(1).toLowerCase() : word.toLowerCase();
}

export function searchWords(
	index: Record<string, [string, string]>,
	term: string,
	limit?: number
): [string, string][] {
	const query = term.toLowerCase().trim();
	if (!query) return [];

	const matches = Object.entries(index).filter(([word, [, preview]]) => {
		const normalizedWord = normalizeWord(word);
		return normalizedWord.includes(query) || preview.toLowerCase().includes(query);
	});

	matches.sort(([wordA, [, previewA]], [wordB, [, previewB]]) => {
		const normA = normalizeWord(wordA);
		const normB = normalizeWord(wordB);
		const previewALower = previewA.toLowerCase();
		const previewBLower = previewB.toLowerCase();

		const getScore = (word: string, preview: string) => {
			if (word === query) return 4;
			if (word.startsWith(query)) return 3;
			if (word.includes(query)) return 2;
			if (preview.includes(query)) return 1;
			return 0;
		};

		const scoreA = getScore(normA, previewALower);
		const scoreB = getScore(normB, previewBLower);

		if (scoreA !== scoreB) return scoreB - scoreA;
		return normA.localeCompare(normB);
	});

	const results = matches.map(([word, [, preview]]) => [word, preview] as [string, string]);
	return limit !== undefined ? results.slice(0, limit) : results;
}
