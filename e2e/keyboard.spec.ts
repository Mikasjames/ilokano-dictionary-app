import { test, expect, type Page } from "@playwright/test";

async function gotoHomeHydrated(page: Page) {
	await page.goto("/");
	// The word-of-the-day card only renders after Svelte hydrates, so this
	// guarantees the window keydown listener is attached before we press keys.
	await expect(page.getByText("Word of the day")).toBeVisible();
}

test("Ctrl+K focuses the search input", async ({ page }) => {
	await gotoHomeHydrated(page);
	await page.keyboard.press("Control+k");
	await expect(page.getByPlaceholder("Type a word to search...")).toBeFocused();
});

test("/ focuses the search input from the page", async ({ page }) => {
	await gotoHomeHydrated(page);
	await page.keyboard.press("/");
	await expect(page.getByPlaceholder("Type a word to search...")).toBeFocused();
});

test("/ while typing in the search box is typed normally, not a shortcut", async ({ page }) => {
	await gotoHomeHydrated(page);
	const input = page.getByPlaceholder("Type a word to search...");
	await input.fill("abaga");
	await page.keyboard.press("/");
	await expect(input).toBeFocused();
	await expect(input).toHaveValue("abaga/");
});
