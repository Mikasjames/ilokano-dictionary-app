import { test, expect } from "@playwright/test";

test("browse letters and open a word from a letter page", async ({ page }) => {
	await page.goto("/browse/");
	await expect(page.getByRole("heading", { name: "Browse by Letter" })).toBeVisible();

	const aLink = page.locator('a[href="/browse/A/"]');
	await expect(aLink).toBeVisible();
	await aLink.click();

	await expect(page).toHaveURL(/\/browse\/A\/$/);
	await expect(page.getByRole("heading", { name: /Words starting with A/ })).toBeVisible();

	const firstWord = page.locator("li a").first();
	await expect(firstWord).toHaveAttribute("href", /\?word=-AK/);
	await firstWord.click();

	await expect(page).toHaveURL(/\?word=-AK/);
	await expect(page.getByText("I, me: the enclitic nominative case form of SIAK.")).toBeVisible();
});
