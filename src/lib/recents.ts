export const RECENTS_KEY = "iloko-recents";
export const RECENTS_MAX = 10;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function storageAvailable(
	storage: StorageLike | null | undefined
): storage is StorageLike {
	return (
		typeof storage === "object" &&
		storage !== null &&
		typeof storage.getItem === "function" &&
		typeof storage.setItem === "function"
	);
}

export function loadRecents(storage: StorageLike | null | undefined = null): string[] {
	if (!storageAvailable(storage)) return [];
	try {
		const raw = storage.getItem(RECENTS_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((w): w is string => typeof w === "string") : [];
	} catch {
		return [];
	}
}

export function saveRecents(
	words: string[],
	storage: StorageLike | null | undefined = null
): void {
	if (!storageAvailable(storage)) return;
	try {
		storage.setItem(RECENTS_KEY, JSON.stringify(words));
	} catch {
		// storage unavailable
	}
}

export function addRecent(list: string[], word: string, max = RECENTS_MAX): string[] {
	return [word, ...list.filter((w) => w !== word)].slice(0, max);
}
