# IloCo. — Ilokano Dictionary

A fast, offline-first digital Ilokano (Ilocano) ↔ English dictionary built with SvelteKit and deployed as a fully static site. Includes a curated dictionary of over 6,500 words with definitions, examples, phrases, common forms, synonyms, and antonyms.

## Features

- **Instant search** — case-insensitive matching over Ilokano headwords and English definitions, with relevance-ranked results
- **Full dictionary entries** — parts of speech, conjugation, origin, examples, phrases & idioms, derivatives, common forms, variations, synonyms, antonyms, and cross-references
- **Browse by letter** — alphabetically explore words, one page per letter
- **Word of the day** — a deterministic daily pick plus a random-word button
- **Deep links** — every word has a shareable URL (`/?word=<word>`) and copy/share buttons
- **Search shortcuts** — press `/` or `Ctrl/⌘+K` anywhere to focus search
- **Recent words** — your last 10 viewed words, persisted locally
- **Offline-ready** — precompressed static output with a service worker that caches assets on demand
- **Dark mode** — theme toggle via mode-watcher

## Tech Stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5 runes) with [`@sveltejs/adapter-static`](https://kit.svelte.dev/docs/adapter-static)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn-svelte](https://shadcn-svelte.com) components
- [bits-ui](https://bits-ui.com) / [cmdk-sv](https://www.cmdk-sv.com) for search
- [svelte-sonner](https://svelte-sonner.vercel.app) for toasts
- [vitest](https://vitest.dev), [ESLint](https://eslint.org) + `typescript-eslint` + `eslint-plugin-svelte`, [Prettier](https://prettier.io) + `prettier-plugin-svelte`

## Dictionary Data

Dictionary entries live in `src/lib/` as one JSON file per letter (`A.json` … `Z.json`). Each file maps a headword to an array of definition objects:

```json
{
	"A": [
		{
			"part_of_speech": "adv.",
			"definition": "indeed, of course; then: a confirmatory particle...",
			"ilok_example": "...",
			"eng_example": "...",
			"conjugation": "...",
			"origin": "...",
			"synonyms": ["...", "..."],
			"antonyms": ["..."],
			"variations": ["..."],
			"cross_references": ["..."],
			"common_forms": ["..."],
			"phrases": [{ "phrase": "...", "definition": "..." }],
			"examples": [{ "root": "...", "derivative": "...", "definition": "..." }]
		}
	]
}
```

### Adding words

1. Edit the letter file(s) in `src/lib/` following the shape above.
2. Regenerate the search index (previews, letters, and word counts for search + browse):

   ```bash
   pnpm generate:index
   ```

   `pnpm generate:index:check` verifies the index is up to date without writing.

## Development

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm check            # type-check (svelte-check)
pnpm lint             # ESLint
pnpm format:check     # Prettier
pnpm test             # unit + data-integrity tests (vitest)
pnpm format           # auto-format all files
```

## Building

```bash
pnpm build            # outputs a fully static site to build/
pnpm preview          # serve the production build locally
```

The site is fully prerendered (`prerender = true`) into static HTML. Deploy the contents of `build/` to any static host.

## Project Structure

```
src/
  lib/
    *.json            # dictionary data (one file per letter)
    search-index.json # generated search index (do not edit by hand)
    dictionary.ts     # shared helpers (load definitions, word-of-the-day, browse, ...)
    utils.ts          # parts-of-speech, text helpers, cn(), transitions
    types/types.ts    # Definition types
    components/
      custom/         # Search, Definition, WordOfTheDay, BadgeWords
      ui/             # shadcn-svelte UI components
  routes/
    +page.svelte      # home: search + word of the day + definition
    browse/           # browse-by-letter index
    browse/[letter]/  # words per letter (prerendered)
  service-worker.js   # offline asset caching
scripts/
  generate-search-index.mjs  # search-index generator + checker
```
