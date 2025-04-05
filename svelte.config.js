import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: null,
			pages: "build",
			assets: "build",
			precompress: false,
			strict: true
		}),
		paths: {
			base: process.argv.includes("dev") ? "" : "/ilokano-dictionary-app"
		}
	}
};

export default config;
