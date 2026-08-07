import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs["flat/recommended"],
	{
		files: ["**/*.svelte", "**/*.ts"],
		languageOptions: {
			globals: {
				...globals.browser,
				__APP_VERSION__: "readonly"
			}
		}
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		}
	},
	{
		files: ["scripts/**/*.mjs"],
		languageOptions: {
			globals: globals.node
		}
	},
	{
		files: ["e2e/**/*.ts", "playwright.config.ts"],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ["src/service-worker.js"],
		languageOptions: {
			globals: globals.worker
		}
	},
	{
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"svelte/no-navigation-without-resolve": "off"
		}
	},
	{
		ignores: ["build/", ".svelte-kit/", "node_modules/", "src/lib/components/ui/"]
	}
);
