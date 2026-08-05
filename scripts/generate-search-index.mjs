import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LIB_DIR = join(process.cwd(), "src", "lib");
const INDEX_PATH = join(LIB_DIR, "search-index.json");
const PREVIEW_MAX_LENGTH = 100;

function letterOf(word) {
	return (word.startsWith("-") ? word[1] : word[0]).toUpperCase();
}

function previewOf(defs) {
	if (!Array.isArray(defs) || defs.length === 0) return "";
	const first = defs[0];
	if (!first || typeof first !== "object" || typeof first.definition !== "string") return "";
	return first.definition.slice(0, PREVIEW_MAX_LENGTH);
}

function buildIndex() {
	const index = {};
	const letterFiles = readdirSync(LIB_DIR)
		.filter((file) => /^[A-Z]\.json$/.test(file))
		.sort();

	for (const file of letterFiles) {
		const data = JSON.parse(readFileSync(join(LIB_DIR, file), "utf8"));
		for (const [word, defs] of Object.entries(data)) {
			index[word] = [letterOf(word), previewOf(defs)];
		}
	}

	return index;
}

const checkOnly = process.argv.includes("--check");
const generated = buildIndex();
const serialized = JSON.stringify(generated, null, 2);

let previous = {};
let exists = false;
try {
	previous = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
	exists = true;
} catch {
	// no previous index yet
}

const oldWords = new Set(Object.keys(previous));
const newWords = new Set(Object.keys(generated));

const added = [...newWords].filter((word) => !oldWords.has(word)).sort();
const dropped = [...oldWords].filter((word) => !newWords.has(word)).sort();
const changedPreviews = [...newWords].filter(
	(word) => oldWords.has(word) && previous[word][1] !== generated[word][1]
).sort();

console.log(`Generated ${newWords.size} search entries from ${exists ? "letter files" : "sources"} (previously ${oldWords.size}).`);
if (added.length) console.log(`  added:    ${added.length} ${added.slice(0, 10).join(", ")}${added.length > 10 ? ", ..." : ""}`);
if (dropped.length) console.log(`  dropped:  ${dropped.length} ${dropped.slice(0, 10).join(", ")}${dropped.length > 10 ? ", ..." : ""}`);
if (changedPreviews.length) console.log(`  previews: ${changedPreviews.length} previews updated`);
if (!added.length && !dropped.length && !changedPreviews.length) console.log("  no changes");

if (checkOnly) {
	const current = readFileSync(INDEX_PATH, "utf8");
	if (current === serialized) {
		console.log("search-index.json is up to date.");
		process.exit(0);
	}
	console.error("search-index.json is out of date. Run `pnpm generate:index`.");
	process.exit(1);
}

writeFileSync(INDEX_PATH, serialized, "utf8");
console.log(`Wrote ${INDEX_PATH}`);
