import { expect, test } from "@playwright/test";
import { cheaperDeal, deal, mockApi } from "./fixtures";

test.beforeEach(async ({ page }) => {
	await mockApi(page);
	await page.goto("/");
	await expect(page.locator(".product-card")).toHaveCount(1);
});

test("mobile layout supports filters and detail without overflow", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.getByText("Redeal")).toBeVisible();
	await expect(page.locator(".product-card")).toHaveCount(1);

	await page.getByRole("button", { name: /advanced filters/i }).click();
	await expect(page.locator("#minPrice")).toBeVisible();
	await page.locator(".product-card").click();
	await expect(page.getByRole("dialog").getByText("Bright test apartment")).toBeVisible();
	await page.keyboard.press("Escape");
	await page.getByRole("button", { name: "Stats" }).click();
	await expect(page.locator("dialog#district-stats-modal").getByText("District Stats")).toBeVisible();

	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > window.innerWidth,
	);
	expect(hasOverflow).toBe(false);
});

