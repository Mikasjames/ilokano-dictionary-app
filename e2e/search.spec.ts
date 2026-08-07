import { test, expect } from "@playwright/test";

test("typing a word surfaces results and opening one shows its definition", async ({ page }) => {
	await page.goto("/");

	const input = page.getByPlaceholder("Type a word to search...");
	await input.fill("abaga");

	const result = page.getByRole("option", { name: /^ABAGA\s/ });
	await expect(result).toBeVisible();
	await expect(page.getByText(/Found \d+ results?/)).toBeVisible();

	await result.click();

	await expect(page).toHaveURL(/\?word=ABAGA/);
	await expect(page.getByRole("heading", { name: "ABAGA" }).first()).toBeVisible();
	await expect(page.getByText("shoulder.", { exact: true }).first()).toBeVisible();
});

test("searching an unknown word shows the no-results message", async ({ page }) => {
	await page.goto("/");

	await page.getByPlaceholder("Type a word to search...").fill("xyzzynotaword");

	await expect(page.getByText(/No words found for/)).toBeVisible();
});
