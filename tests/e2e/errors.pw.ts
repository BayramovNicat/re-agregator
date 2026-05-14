import { expect, test } from "@playwright/test";
import { cheaperDeal, deal, mockApi } from "./fixtures";

test.beforeEach(async ({ page }) => {
	await mockApi(page);
	await page.goto("/");
	await expect(page.locator(".product-card")).toHaveCount(1);
});

test("empty search response shows no results", async ({ page }) => {
	await page.unroute("**/api/deals/undervalued**");
	await page.route("**/api/deals/undervalued**", async (route) => {
		await route.fulfill({
			json: {
				location: "__all__",
				threshold_pct: 10,
				limit: 200,
				offset: 0,
				count: 0,
				total: 0,
				data: [],
			},
		});
	});

	await page.locator("#discount-threshold").fill("5");
	await expect(page.getByText("No results found")).toBeVisible();
	await expect(page.locator(".product-card")).toHaveCount(0);
});

test("search API error shows toast and no cards", async ({ page }) => {
	await page.unroute("**/api/deals/undervalued**");
	await page.route("**/api/deals/undervalued**", async (route) => {
		await route.fulfill({ status: 500, json: { error: "Search failed" } });
	});

	await page.locator("#discount-threshold").fill("5");
	await expect(page.getByText("Search failed")).toBeVisible();
	await expect(page.locator(".product-card")).toHaveCount(0);
});

test("locations API failure shows failed option", async ({ page }) => {
	await page.unroute("**/api/deals/locations");
	await page.route("**/api/deals/locations", async (route) => {
		await route.fulfill({ status: 500, json: { error: "failed" } });
	});
	await page.reload();

	await page.getByRole("combobox", { name: "Location" }).click();
	await expect(
		page.getByRole("option", { name: "Failed to load locations" }),
	).toBeVisible();
});
