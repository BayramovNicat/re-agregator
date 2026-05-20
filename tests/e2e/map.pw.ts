import { expect, test } from "@playwright/test";
import { deal, mockApi } from "./fixtures";

test.beforeEach(async ({ page }) => {
	await mockApi(page);
	await page.goto("/");
	await expect(page.locator(".product-card")).toHaveCount(1);
});

test("heatmap dialog opens from location map", async ({ page }) => {
	await page.getByRole("button", { name: "Location Map" }).click();
	await expect(page.locator("dialog#heatmap-modal")).toBeVisible();
	await expect(
		page.locator("#heatmap-map-container .leaflet-pane").first(),
	).toHaveCount(1);
});

test("heatmap circle selects location", async ({ page }) => {
	const searchUrls: string[] = [];
	await page.unroute("**/api/deals/undervalued**");
	await page.route("**/api/deals/undervalued**", async (route) => {
		searchUrls.push(route.request().url());
		await route.fulfill({
			json: {
				location: "Yasamal",
				threshold_pct: 10,
				limit: 200,
				offset: 0,
				count: 1,
				total: 1,
				data: [deal],
			},
		});
	});

	await page.getByRole("button", { name: "Location Map" }).click();
	const dialog = page.locator("dialog#heatmap-modal");
	await expect(dialog).toBeVisible();
	await page
		.locator("#heatmap-map-container .leaflet-overlay-pane path")
		.first()
		.click({ force: true });

	await expect(dialog).toBeHidden();
	await expect
		.poll(() => searchUrls.at(-1) ?? "")
		.toContain("location=Yasamal");
	await page.getByRole("button", { name: "Location Map" }).click();
	await expect(
		page.locator(
			'#heatmap-map-container .leaflet-overlay-pane path[stroke="white"]',
		),
	).toHaveCount(1);
});

test("map view loads pins and switches back", async ({ page }) => {
	const mapUrls: string[] = [];
	await page.unroute("**/api/deals/map-pins**");
	await page.route("**/api/deals/map-pins**", async (route) => {
		mapUrls.push(route.request().url());
		await route.fulfill({
			json: {
				count: 1,
				data: [
					{
						source_url: deal.source_url,
						lat: deal.latitude,
						lng: deal.longitude,
						price: deal.price,
						price_per_sqm: deal.price_per_sqm,
						area_sqm: deal.area_sqm,
						floor: deal.floor,
						total_floors: deal.total_floors,
						rooms: deal.rooms,
						location_name: deal.location_name,
						image_url: deal.image_urls[0],
						discount_percent: deal.discount_percent,
						tier: deal.tier,
					},
				],
			},
		});
	});

	await page.locator('button[title="Map view"]').click();
	await expect.poll(() => mapUrls.length).toBeGreaterThan(0);
	await expect(page.locator(".leaflet-container")).toBeVisible();
	await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(1);

	await page.locator('button[title="Grid view"]').click();
	await expect(page.locator(".product-card")).toHaveCount(1);
});

test("map pin opens property detail", async ({ page }) => {
	await page.locator('button[title="Map view"]').click();
	await expect(page.locator(".leaflet-container")).toBeVisible();
	await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(1);

	await page
		.locator(".leaflet-overlay-pane path")
		.first()
		.click({ force: true });
	const dialog = page.locator("dialog#prop-detail-modal");
	await expect(dialog).toBeVisible();
	await expect(dialog.getByText("Bright test apartment")).toBeVisible();
	await expect(
		dialog.getByRole("link", { name: /view listing/i }),
	).toHaveAttribute("href", deal.source_url);
});

test("map pin hover shows tooltip and hides it on mouseout", async ({
	page,
}) => {
	await page.locator('button[title="Map view"]').click();
	const pin = page.locator(".leaflet-overlay-pane path").first();
	await expect(pin).toBeVisible();

	await pin.hover({ force: true });
	await expect(page.locator(".leaflet-tooltip")).toContainText("₼ 120,000");
	await expect(page.locator(".leaflet-tooltip")).toContainText("-25%");

	await page.mouse.move(0, 0);
	await expect(page.locator(".leaflet-tooltip")).toHaveCount(0);
});
