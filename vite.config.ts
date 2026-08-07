import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), svelteTesting()],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	},
	build: {
		target: "esnext"
	},
	worker: {
		format: "es"
	},
	server: {
		host: true,
		allowedHosts: true
	},
	test: {
		include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
		environment: "node",
		setupFiles: ["src/test/setup.ts"],
		coverage: {
			provider: "v8",
			include: ["src/lib/**/*.ts", "src/lib/components/**/*.svelte", "scripts/**/*.mjs"],
			exclude: [
				"**/*.test.*",
				"src/lib/components/ui/**",
				"src/lib/types/**",
				"src/lib/search-index.json"
			],
			reporter: ["text", "html"],
			reportOnFailure: true,
			thresholds: {
				lines: 70,
				functions: 75,
				branches: 55,
				statements: 70
			}
		}
	}
});
