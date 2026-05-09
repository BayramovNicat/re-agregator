import { expect, test } from "@playwright/test";
import { cheaperDeal, deal, mockApi } from "./fixtures";

test.beforeEach(async ({ page }) => {
	await mockApi(page);
	await page.goto("/");
	await expect(page.locator(".product-card")).toHaveCount(1);
});

test("loads homepage and shows first result", async ({ page }) => {
	await expect(page.getByText("Redeal")).toBeVisible();
	await expect(page.locator(".product-card")).toHaveCount(1);
	await expect(page.getByText("₼ 120,000")).toBeVisible();
	await expect(page.locator(".product-card").getByText("High Value Deal")).toBeVisible();
});

test("grid and list view switch", async ({ page }) => {
	await page.getByRole("button", { name: /list view/i }).click();
	await expect(page.locator(".product-card")).toHaveCount(1);
	await expect(page.getByText("View ↗")).toBeVisible();

	await page.getByRole("button", { name: /grid view/i }).click();
	await expect(page.getByText("View listing")).toBeVisible();
});

