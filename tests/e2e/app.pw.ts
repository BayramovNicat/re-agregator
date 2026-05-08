import { expect, type Page, test } from "@playwright/test";

const deal = {
	source_url: "https://example.com/deal-1",
	price: 120000,
	area_sqm: 80,
	price_per_sqm: 1500,
	location_avg_price_per_sqm: 2000,
	discount_percent: 25,
	tier: "High Value Deal",
	district: "Yasamal",
	location_name: "Yasamal",
	rooms: 3,
	floor: 4,
	total_floors: 12,
	is_urgent: true,
	has_document: true,
	has_repair: true,
	has_mortgage: false,
	has_active_mortgage: false,
	price_drop_count: 1,
	posted_date: new Date().toISOString(),
	description: "Bright test apartment",
	image_urls: ["https://example.com/image-1.jpg", "https://example.com/image-2.jpg"],
	latitude: 40.377,
	longitude: 49.837,
	price_history: [
		{ price: "140000", recorded_at: "2026-01-01T00:00:00.000Z" },
		{ price: "120000", recorded_at: "2026-02-01T00:00:00.000Z" },
	],
};

async function mockApi(page: Page, options: { searchUrls?: string[] } = {}) {
	await page.route("**/api/deals/locations", async (route) => {
		await route.fulfill({ json: { data: ["Yasamal", "Nərimanov"] } });
	});
	await page.route("**/api/deals/undervalued**", async (route) => {
		options.searchUrls?.push(route.request().url());
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
	await page.route("**/api/deals/by-urls", async (route) => {
		await route.fulfill({ json: { data: [deal] } });
	});
	await page.route("**/api/deals/trend**", async (route) => {
		await route.fulfill({ json: { location: "Yasamal", data: [] } });
	});
	await page.route("**/api/deals/map-pins**", async (route) => {
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
	await page.route("**/api/heatmap", async (route) => {
		await route.fulfill({
			json: {
				data: [
					{
						location_name: "Yasamal",
						avg_price_per_sqm: 2000,
						count: 10,
						lat: 40.377,
						lng: 49.837,
						recent_avg: 2100,
						prior_avg: 2000,
						trend: "up",
					},
				],
			},
		});
	});
	await page.route("**/api/alerts**", async (route) => {
		if (route.request().method() === "GET") {
			await route.fulfill({ json: { ok: true, alerts: [] } });
			return;
		}
		await route.fulfill({ json: { ok: true, id: "alert-1", token: "token-1" } });
	});
	await page.route("**/api/scrape/runs**", async (route) => {
		await route.fulfill({ json: { ok: true, runs: [] } });
	});
	await page.route("**/health", async (route) => {
		await route.fulfill({ json: { status: "ok", timestamp: new Date().toISOString(), properties: 1 } });
	});
}

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

test("grid and list view switch", async ({ page }) => {
	await page.getByRole("button", { name: /list view/i }).click();
	await expect(page.locator(".product-card")).toHaveCount(1);
	await expect(page.getByText("View ↗")).toBeVisible();

	await page.getByRole("button", { name: /grid view/i }).click();
	await expect(page.getByText("View listing")).toBeVisible();
});

test("bookmark persists after reload and saved view opens", async ({ page }) => {
	await page.getByRole("button", { name: "Save" }).click();
	await expect(page.getByRole("button", { name: /saved 1/i })).toBeVisible();

	await page.reload();
	await expect(page.getByRole("button", { name: /saved 1/i })).toBeVisible();
	await page.getByRole("button", { name: /saved 1/i }).click();
	await expect(page.locator(".product-card")).toHaveCount(1);
});

test("card opens property detail dialog", async ({ page }) => {
	await page.locator(".product-card").click();
	await expect(page.getByRole("dialog").getByText("Bright test apartment")).toBeVisible();
});

test("hide removes listing", async ({ page }) => {
	await page.getByRole("button", { name: "Hide" }).click();
	await expect(page.locator(".product-card")).toHaveCount(0);
});

test("alerts dialog saves chat id", async ({ page }) => {
	await page.getByRole("button", { name: /alert me/i }).click();
	await expect(page.getByRole("dialog").getByText("Telegram alerts")).toBeVisible();
	await page.getByLabel("Telegram Chat ID").fill("123456789");
	await page.getByRole("button", { name: /save alert/i }).click();
	await expect(page.getByRole("dialog")).toBeHidden();
	expect(await page.evaluate(() => localStorage.getItem("re-chatid"))).toBe(
		"123456789",
	);
});

test("gallery opens from card photo button", async ({ page }) => {
	await page.locator(".product-card").getByRole("button", { name: "Photos" }).click();
	await expect(page.getByRole("dialog").getByRole("region", { name: "Gallery" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Next photo" })).toBeVisible();
});

test("district stats dialog opens with heatmap data", async ({ page }) => {
	await page.getByRole("button", { name: "Stats" }).click();
	await expect(page.getByRole("dialog").getByText("District Stats")).toBeVisible();
	await expect(page.getByRole("dialog").getByRole("cell", { name: "Yasamal" })).toBeVisible();
	await expect(page.getByRole("columnheader", { name: /Avg ₼\/m²/i })).toBeVisible();
});

test("scrape ops dialog opens with empty runs", async ({ page }) => {
	await page.getByRole("button", { name: "Scrape Ops" }).click();
	await expect(page.getByRole("dialog").getByText("Scrape runs", { exact: true })).toBeVisible();
	await expect(page.getByRole("dialog").getByText("No scrape runs yet").first()).toBeVisible();
});

test("heatmap dialog opens from location map", async ({ page }) => {
	await page.getByRole("button", { name: "Location Map" }).click();
	await expect(page.locator("dialog#heatmap-modal")).toBeVisible();
	await expect(page.locator("#heatmap-map-container .leaflet-pane").first()).toHaveCount(1);
});

test("mobile layout smoke", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.getByText("Redeal")).toBeVisible();
	await expect(page.locator(".product-card")).toHaveCount(1);
	await expect(page.getByRole("button", { name: /advanced filters/i })).toBeVisible();
});
