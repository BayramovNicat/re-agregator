import { expect, test } from "@playwright/test";
import { mockApi } from "./fixtures";

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

test("language switcher persists selected language", async ({ page }) => {
	await page.getByRole("button", { name: /en/i }).click();
	await page.getByRole("button", { name: "AZ" }).click();
	await expect(page.locator(".product-card")).toHaveCount(1);

	expect(await page.evaluate(() => localStorage.getItem("redeal-lang"))).toBe("az");
	await expect(page.getByRole("button", { name: "AZ", exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: /ətraflı filtrlər/i })).toBeVisible();
});

