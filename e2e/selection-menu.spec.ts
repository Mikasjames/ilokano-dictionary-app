import { test, expect } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const abagaHeading = (page: Parameters<typeof test>[0]["page"]) =>
	page.getByRole("heading", { name: "ABAGA" }).first();

test("selecting a word shows the action bar and Define opens a panel", async ({ page }) => {
	await page.goto("/?word=ABAGA");
	await expect(abagaHeading(page)).toBeVisible();

	await abagaHeading(page).selectText();

	await expect(page.getByRole("button", { name: "Define" })).toBeVisible();
	await page.getByRole("button", { name: "Define" }).click();

	await expect(page.getByText("Definition").first()).toBeVisible();
	await expect(page.getByText("shoulder.", { exact: true }).first()).toBeVisible();
	await expect(page.getByRole("button", { name: "View full entry" })).toBeVisible();
});

test("Copy copies the selected word to the clipboard", async ({ page }) => {
	await page.goto("/?word=ABAGA");
	await expect(abagaHeading(page)).toBeVisible();

	await abagaHeading(page).selectText();

	await expect(page.getByRole("button", { name: "Copy", exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Copy", exact: true }).click();

	await expect(page.getByText("Copied to clipboard")).toBeVisible();
	const clip = await page.evaluate(() => navigator.clipboard.readText());
	expect(clip).toBe("ABAGA");
});

test("Search dictionary from a selection runs a search", async ({ page }) => {
	await page.goto("/?word=ABAGA");
	await expect(abagaHeading(page)).toBeVisible();

	await abagaHeading(page).selectText();

	await expect(page.getByRole("button", { name: "Search dictionary" })).toBeVisible();
	await page.getByRole("button", { name: "Search dictionary" }).click();

	await expect(page.getByPlaceholder("Type a word to search...")).toHaveValue("ABAGA");
	await expect(page.getByRole("option", { name: /^ABAGA\s/ })).toBeVisible();
});
