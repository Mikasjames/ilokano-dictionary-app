import { describe, it, expect, vi, afterEach } from "vitest";
import { RECENTS_KEY, RECENTS_MAX, loadRecents, saveRecents, addRecent } from "./recents";

function memoryStorage(initial: Record<string, string> = {}): Storage {
	const map = new Map(Object.entries(initial));
	return {
		getItem: vi.fn((key: string) => (map.has(key) ? map.get(key)! : null)),
		setItem: vi.fn((key: string, value: string) => void map.set(key, value)),
		removeItem: vi.fn((key: string) => void map.delete(key)),
		clear: vi.fn(() => void map.clear()),
		key: vi.fn((i: number) => [...map.keys()][i] ?? null),
		get length() {
			return map.size;
		}
	};
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("addRecent", () => {
	it("moves an existing word to the front", () => {
		expect(addRecent(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
	});

	it("deduplicates the promoted word", () => {
		expect(addRecent(["b", "a", "b"], "b")).toEqual(["b", "a"]);
	});

	it("caps the list at the max", () => {
		const list = Array.from({ length: RECENTS_MAX }, (_, i) => `w${i}`);
		const next = addRecent(list, "new");
		expect(next).toHaveLength(RECENTS_MAX);
		expect(next[0]).toBe("new");
	});

	it("honors a custom max", () => {
		expect(addRecent(["a", "b"], "c", 2)).toEqual(["c", "a"]);
	});
});

describe("loadRecents", () => {
	it("returns [] when storage is unavailable", () => {
		expect(loadRecents()).toEqual([]);
		expect(loadRecents(null)).toEqual([]);
		expect(loadRecents({} as Storage)).toEqual([]);
	});

	it("returns [] when the key is absent", () => {
		expect(loadRecents(memoryStorage())).toEqual([]);
	});

	it("parses a stored JSON array", () => {
		const storage = memoryStorage({ [RECENTS_KEY]: '["balay","abaga"]' });
		expect(loadRecents(storage)).toEqual(["balay", "abaga"]);
	});

	it("returns [] for corrupt JSON", () => {
		const storage = memoryStorage({ [RECENTS_KEY]: "{not json" });
		expect(loadRecents(storage)).toEqual([]);
	});

	it("drops non-string entries", () => {
		const storage = memoryStorage({ [RECENTS_KEY]: '["ok", 42, null]' });
		expect(loadRecents(storage)).toEqual(["ok"]);
	});

	it("returns [] when storage throws", () => {
		const storage = memoryStorage();
		storage.getItem = vi.fn(() => {
			throw new Error("denied");
		});
		expect(loadRecents(storage)).toEqual([]);
	});
});

describe("saveRecents", () => {
	it("writes the list as JSON under the key", () => {
		const storage = memoryStorage();
		saveRecents(["a", "b"], storage);
		expect(storage.setItem).toHaveBeenCalledWith(RECENTS_KEY, '["a","b"]');
	});

	it("no-ops without storage", () => {
		expect(() => saveRecents(["a"])).not.toThrow();
	});

	it("swallows storage write errors", () => {
		const storage = memoryStorage();
		storage.setItem = vi.fn(() => {
			throw new Error("quota exceeded");
		});
		expect(() => saveRecents(["a"], storage)).not.toThrow();
	});
});

describe("roundtrip", () => {
	it("persists and reloads the same list", () => {
		const storage = memoryStorage();
		saveRecents(["c", "b", "a"], storage);
		expect(loadRecents(storage)).toEqual(["c", "b", "a"]);
	});
});
