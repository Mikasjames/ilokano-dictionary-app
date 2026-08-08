import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
	letterOf,
	previewOf,
	buildIndex,
	computeChanges,
	diffLines,
	main,
	PREVIEW_MAX_LENGTH
} from "./generate-search-index.mjs";

const LIB_DIR = join(process.cwd(), "src", "lib");
const INDEX = JSON.parse(readFileSync(join(LIB_DIR, "search-index.json"), "utf8"));

describe("letterOf", () => {
	it("returns the uppercase first letter", () => {
		expect(letterOf("abaga")).toBe("A");
		expect(letterOf("Balay")).toBe("B");
	});

	it("strips a leading hyphen before taking the letter", () => {
		expect(letterOf("-sabong")).toBe("S");
	});
});

describe("previewOf", () => {
	it("returns an empty string for missing or empty definitions", () => {
		expect(previewOf(undefined)).toBe("");
		expect(previewOf(null)).toBe("");
		expect(previewOf([])).toBe("");
	});

	it("returns an empty string for malformed definitions", () => {
		expect(previewOf([null])).toBe("");
		expect(previewOf(["not-an-object"])).toBe("");
		expect(previewOf([{ definition: 42 }])).toBe("");
	});

	it("uses the first definition, capped at PREVIEW_MAX_LENGTH", () => {
		expect(previewOf([{ definition: "a house" }])).toBe("a house");
		const long = "x".repeat(PREVIEW_MAX_LENGTH + 20);
		expect(previewOf([{ definition: long }])).toHaveLength(PREVIEW_MAX_LENGTH);
	});
});

describe("buildIndex", () => {
	let dir;
	beforeAll(() => {
		dir = mkdtempSync(join(tmpdir(), "iloko-index-"));
		writeFileSync(
			join(dir, "A.json"),
			JSON.stringify({
				abaga: [{ definition: "shoulder; the joint" }],
				"-sabong": [{ definition: "flower" }],
				atok: []
			})
		);
		writeFileSync(join(dir, "B.json"), JSON.stringify({ balay: [{ definition: "house" }] }));
		writeFileSync(join(dir, "README.md"), "not a letter file");
	});
	afterAll(() => rmSync(dir, { recursive: true, force: true }));

	it("builds one entry per word with its letter and preview", () => {
		const index = buildIndex(dir);
		expect(index.abaga).toEqual(["A", "shoulder; the joint"]);
		expect(index["-sabong"]).toEqual(["S", "flower"]);
		expect(index.balay).toEqual(["B", "house"]);
	});

	it("uses an empty preview when a word has no definitions", () => {
		expect(buildIndex(dir).atok).toEqual(["A", ""]);
	});

	it("ignores non-letter files", () => {
		expect(Object.keys(buildIndex(dir))).not.toContain("README.md");
	});
});

describe("computeChanges", () => {
	it("detects added, dropped, and changed-preview words", () => {
		const changes = computeChanges(
			{ balay: ["B", "house"], abaga: ["A", "old preview"], gone: ["G", "x"] },
			{ balay: ["B", "house"], abaga: ["A", "new preview"], fresh: ["F", "y"] }
		);
		expect(changes.added).toEqual(["fresh"]);
		expect(changes.dropped).toEqual(["gone"]);
		expect(changes.changedPreviews).toEqual(["abaga"]);
	});

	it("reports empty arrays when nothing changed", () => {
		const changes = computeChanges({ balay: ["B", "house"] }, { balay: ["B", "house"] });
		expect(changes).toEqual({ added: [], dropped: [], changedPreviews: [] });
	});
});

describe("diffLines", () => {
	it("reports 'no changes' when the indexes match", () => {
		const lines = diffLines({
			previous: { balay: ["B", "house"] },
			generated: { balay: ["B", "house"] },
			exists: true
		});
		expect(lines).toContain("  no changes");
	});

	it("summarizes added, dropped, and updated previews", () => {
		const lines = diffLines({
			previous: { balay: ["B", "house"], abaga: ["A", "old"], gone: ["G", "x"] },
			generated: { balay: ["B", "house"], abaga: ["A", "new"], fresh: ["F", "y"] },
			exists: true
		});
		expect(lines).toContain("  added:    1 fresh");
		expect(lines).toContain("  dropped:  1 gone");
		expect(lines).toContain("  previews: 1 previews updated");
	});

	it("uses 'sources' wording when no previous index exists", () => {
		const lines = diffLines({ previous: {}, generated: { balay: ["B", "house"] }, exists: false });
		expect(lines[0]).toContain("from sources");
		expect(lines[0]).toContain("previously 0");
	});

	it("truncates long added/dropped lists after 10 entries", () => {
		const added = Object.fromEntries(
			Array.from({ length: 12 }, (_, i) => [`w${i}`, ["W", ""]])
		);
		const lines = diffLines({ previous: {}, generated: added, exists: false });
		const addedLine = lines.find((l) => l.startsWith("  added:"));
		expect(addedLine).toMatch(/^ {2}added: +12 /);
		expect(addedLine).toContain("...");
		expect(addedLine.match(/w\d+/g)).toHaveLength(10);
	});
});

describe("main", () => {
	let dir;
	let indexPath;
	const baseFiles = {
		"A.json": JSON.stringify({ abaga: [{ definition: "shoulder" }] })
	};
	const log = vi.fn();
	const error = vi.fn();

	function setupIndex(content) {
		dir = mkdtempSync(join(tmpdir(), "iloko-main-"));
		indexPath = join(dir, "search-index.json");
		for (const [name, body] of Object.entries(baseFiles)) {
			writeFileSync(join(dir, name), body);
		}
		if (content !== undefined) writeFileSync(indexPath, JSON.stringify(content, null, 2));
		log.mockClear();
		error.mockClear();
	}

	afterAll(() => {
		if (dir) rmSync(dir, { recursive: true, force: true });
	});

	it("writes the index and reports a fresh build when none exists", () => {
		setupIndex(undefined);
		const code = main({ argv: [], libDir: dir, indexPath, log, error });

		expect(code).toBe(0);
		expect(existsSync(indexPath)).toBe(true);
		expect(log).toHaveBeenCalledWith(expect.stringContaining("Generated 1 search entries from sources"));
		expect(log).toHaveBeenCalledWith(expect.stringContaining(`Wrote ${indexPath}`));
		expect(JSON.parse(readFileSync(indexPath, "utf8"))).toEqual({ abaga: ["A", "shoulder"] });
	});

	it("reports added words against an existing index", () => {
		setupIndex({ balay: ["B", "house"] });
		const code = main({ argv: [], libDir: dir, indexPath, log, error });

		expect(code).toBe(0);
		expect(log).toHaveBeenCalledWith(expect.stringContaining("from letter files"));
		expect(log).toHaveBeenCalledWith(expect.stringContaining("added:    1 abaga"));
		expect(log).toHaveBeenCalledWith(expect.stringContaining("dropped:  1 balay"));
	});

	it("passes in --check mode when the index is up to date", () => {
		setupIndex({ abaga: ["A", "shoulder"] });
		const before = readFileSync(indexPath, "utf8");
		const code = main({ argv: ["--check"], libDir: dir, indexPath, log, error });

		expect(code).toBe(0);
		expect(log).toHaveBeenCalledWith("search-index.json is up to date.");
		expect(error).not.toHaveBeenCalled();
		expect(readFileSync(indexPath, "utf8")).toBe(before);
	});

	it("fails in --check mode when the index is out of date", () => {
		setupIndex({ balay: ["B", "house"] });
		const code = main({ argv: ["--check"], libDir: dir, indexPath, log, error });

		expect(code).toBe(1);
		expect(error).toHaveBeenCalledWith(
			"search-index.json is out of date. Run `pnpm generate:index`."
		);
		expect(log).not.toHaveBeenCalledWith(expect.stringContaining("up to date"));
	});

	it("writes the serialized index with the default invocation shape", () => {
		setupIndex(undefined);
		const code = main({ libDir: dir, indexPath, log, error });

		expect(code).toBe(0);
		const serialized = readFileSync(indexPath, "utf8");
		expect(serialized.startsWith("{")).toBe(true);
		expect(serialized).toContain('"abaga"');
	});
});

describe("search-index.json", () => {
	it("has an entry for every word across all letter files", () => {
		let wordCount = 0;
		for (const file of readdirSync(LIB_DIR).filter((f) => /^[A-Z]\.json$/.test(f))) {
			const data = JSON.parse(readFileSync(join(LIB_DIR, file), "utf8"));
			for (const word of Object.keys(data)) {
				expect(INDEX).toHaveProperty(word);
				wordCount += 1;
			}
		}
		expect(Object.keys(INDEX).length).toBe(wordCount);
	});

	it("indexes every word under its correct letter", () => {
		for (const [word, [letter]] of Object.entries(INDEX)) {
			expect(letter).toBe(letterOf(word));
		}
	});

	it("uses the first definition as the preview", () => {
		for (const file of ["A.json", "B.json", "K.json"]) {
			const data = JSON.parse(readFileSync(join(LIB_DIR, file), "utf8"));
			const firstWord = Object.keys(data)[0];
			const defs = data[firstWord];
			const expected = defs[0]?.definition?.slice(0, 100) ?? "";
			expect(INDEX[firstWord][1]).toBe(expected);
		}
	});

	it("is sorted by word for a letter", () => {
		const words = Object.entries(INDEX)
			.filter(([, [letter]]) => letter === "A")
			.map(([word]) => word)
			.sort();
		expect(words).toEqual(words);
	});
});
