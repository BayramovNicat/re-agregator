import { expect, test } from "@playwright/test";
import { cheaperDeal, deal, mockApi } from "./fixtures";

test.beforeEach(async ({ page }) => {
	await mockApi(page);
	await page.goto("/");
	await expect(page.locator(".product-card")).toHaveCount(1);
});

test("advanced filters toggle and clear", async ({ page }) => {
	const advanced = page.getByRole("button", { name: /advanced filters/i });
	await advanced.click();
	await expect(advanced).toHaveAttribute("aria-expanded", "true");

	await page.locator("#minPrice").fill("100000");
	await page.getByRole("button", { name: /clear filters/i }).click();
	await expect(page.locator("#minPrice")).toHaveValue("");
});

test("location selector updates search params", async ({ page }) => {
	const searchUrls: string[] = [];
	await page.unroute("**/api/deals/undervalued**");
	await page.route("**/api/deals/undervalued**", async (route) => {
		searchUrls.push(route.request().url());
		await route.fulfill({
			json: {
				location: "__all__",
				threshold_pct: 10,
				limit: 200,
				offset: 0,
				count: 1,
				total: 1,
				data: [deal],
			},
		});
	});

	const location = page.getByRole("combobox", { name: "Location" });
	await location.click();
	await page.getByRole("option", { name: "Yasamal" }).click();
	await expect.poll(() => searchUrls.at(-1) ?? "").toContain("location=Yasamal");

	await page.getByRole("option", { name: "All locations" }).click();
	await expect.poll(() => searchUrls.at(-1) ?? "").toContain("location=__all__");
});

test("threshold slider updates label and search params", async ({ page }) => {
	const searchUrls: string[] = [];
	await page.unroute("**/api/deals/undervalued**");
	await page.route("**/api/deals/undervalued**", async (route) => {
		searchUrls.push(route.request().url());
		await route.fulfill({
			json: {
				location: "__all__",
				threshold_pct: 10,
				limit: 200,
				offset: 0,
				count: 1,
				total: 1,
				data: [deal],
			},
		});
	});

	await page.locator("#discount-threshold").fill("0");
	await expect(page.getByText("All", { exact: true })).toBeVisible();
	await expect.poll(() => searchUrls.at(-1) ?? "").toContain("threshold=0");

	await page.locator("#discount-threshold").fill("20");
	await expect(page.getByText("20%", { exact: true })).toBeVisible();
	await expect.poll(() => searchUrls.at(-1) ?? "").toContain("threshold=20");
});

test("advanced filters update params and removable chips", async ({ page }) => {
	const searchUrls: string[] = [];
	await page.unroute("**/api/deals/undervalued**");
	await page.route("**/api/deals/undervalued**", async (route) => {
		searchUrls.push(route.request().url());
		await route.fulfill({
			json: {
				location: "__all__",
				threshold_pct: 10,
				limit: 200,
				offset: 0,
				count: 1,
				total: 1,
				data: [deal],
			},
		});
	});

	await page.getByRole("button", { name: /advanced filters/i }).click();
	await page.locator("#minPrice").fill("100000");
	await page.locator("#maxPrice").fill("130000");

	await expect.poll(() => searchUrls.at(-1) ?? "").toContain("minPrice=100000");
	await expect.poll(() => searchUrls.at(-1) ?? "").toContain("maxPrice=130000");
	await expect(page.getByText("Min ₼: 100000")).toBeVisible();

	await page.getByText("Min ₼: 100000").getByRole("button", { name: "Remove filter" }).click();
	await expect(page.locator("#minPrice")).toHaveValue("");
	await expect.poll(() => searchUrls.at(-1) ?? "").not.toContain("minPrice=100000");
});

test("sort selection updates API params and persists", async ({ page }) => {
	const searchUrls: string[] = [];
	await page.unroute("**/api/deals/undervalued**");
	await page.route("**/api/deals/undervalued**", async (route) => {
		const url = route.request().url();
		searchUrls.push(url);
		const data = url.includes("sort=price-asc") ? [cheaperDeal, deal] : [deal, cheaperDeal];
		await route.fulfill({
			json: {
				location: "__all__",
				threshold_pct: 10,
				limit: 200,
				offset: 0,
				count: 2,
				total: 2,
				data,
			},
		});
	});

	await page.getByLabel("Sort by").selectOption("price-asc");
	await expect.poll(() => searchUrls.at(-1) ?? "").toContain("sort=price-asc");
	await expect(page.locator(".product-card").first()).toContainText("₼ 90,000");

	await page.reload();
	await expect(page.getByLabel("Sort by")).toHaveValue("price-asc");
});

