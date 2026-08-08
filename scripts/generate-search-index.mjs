import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const LIB_DIR = join(process.cwd(), "src", "lib");
const INDEX_PATH = join(LIB_DIR, "search-index.json");
export const PREVIEW_MAX_LENGTH = 100;

export function letterOf(word) {
	return (word.startsWith("-") ? word[1] : word[0]).toUpperCase();
}

export function previewOf(defs) {
	if (!Array.isArray(defs) || defs.length === 0) return "";
	const first = defs[0];
	if (!first || typeof first !== "object" || typeof first.definition !== "string") return "";
	return first.definition.slice(0, PREVIEW_MAX_LENGTH);
}

export function buildIndex(libDir = LIB_DIR) {
	const index = {};
	const letterFiles = readdirSync(libDir)
		.filter((file) => /^[A-Z]\.json$/.test(file))
		.sort();

	for (const file of letterFiles) {
		const data = JSON.parse(readFileSync(join(libDir, file), "utf8"));
		for (const [word, defs] of Object.entries(data)) {
			index[word] = [letterOf(word), previewOf(defs)];
		}
	}

	return index;
}

export function computeChanges(previous, generated) {
	const oldWords = new Set(Object.keys(previous));
	const newWords = new Set(Object.keys(generated));

	const added = [...newWords].filter((word) => !oldWords.has(word)).sort();
	const dropped = [...oldWords].filter((word) => !newWords.has(word)).sort();
	const changedPreviews = [...newWords]
		.filter((word) => oldWords.has(word) && previous[word][1] !== generated[word][1])
		.sort();

	return { added, dropped, changedPreviews };
}

export function diffLines({ previous, generated, exists }) {
	const { added, dropped, changedPreviews } = computeChanges(previous, generated);
	const lines = [];

	lines.push(
		`Generated ${Object.keys(generated).length} search entries from ${exists ? "letter files" : "sources"} (previously ${Object.keys(previous).length}).`
	);
	if (added.length)
		lines.push(
			`  added:    ${added.length} ${added.slice(0, 10).join(", ")}${added.length > 10 ? ", ..." : ""}`
		);
	if (dropped.length)
		lines.push(
			`  dropped:  ${dropped.length} ${dropped.slice(0, 10).join(", ")}${dropped.length > 10 ? ", ..." : ""}`
		);
	if (changedPreviews.length)
		lines.push(`  previews: ${changedPreviews.length} previews updated`);
	if (!added.length && !dropped.length && !changedPreviews.length) lines.push("  no changes");

	return lines;
}

export function main({
	argv = process.argv,
	libDir = LIB_DIR,
	indexPath = INDEX_PATH,
	log = console.log,
	error = console.error
} = {}) {
	const checkOnly = argv.includes("--check");
	const generated = buildIndex(libDir);
	const serialized = JSON.stringify(generated, null, 2);

	let previous = {};
	let exists = false;
	try {
		previous = JSON.parse(readFileSync(indexPath, "utf8"));
		exists = true;
	} catch {
		// no previous index yet
	}

	for (const line of diffLines({ previous, generated, exists })) log(line);

	if (checkOnly) {
		const current = readFileSync(indexPath, "utf8");
		if (current === serialized) {
			log("search-index.json is up to date.");
			return 0;
		}
		error("search-index.json is out of date. Run `pnpm generate:index`.");
		return 1;
	}

	writeFileSync(indexPath, serialized, "utf8");
	log(`Wrote ${indexPath}`);
	return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
	process.exit(main());
}
