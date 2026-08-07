import { test, expect } from "@playwright/test";

test("app stays usable offline after the service worker has cached it", async ({
	page,
	context
}) => {
	await page.goto("/");

	await page.waitForFunction(() => navigator.serviceWorker?.ready !== undefined);

	await page.reload();
	await page.waitForLoadState("networkidle");

	await context.setOffline(true);
	await page.reload();

	await expect(page.getByPlaceholder("Type a word to search...")).toBeVisible();
	await expect(page.getByText("Word of the day")).toBeVisible();
});
