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

test("detail actions update saved state, source link, and hidden cards", async ({ page }) => {
	await page.locator(".product-card").click();
	const dialog = page.locator("dialog#prop-detail-modal");
	await expect(dialog.getByText("Bright test apartment")).toBeVisible();
	await expect(dialog.getByRole("link", { name: /view listing/i })).toHaveAttribute(
		"href",
		deal.source_url,
	);

	await dialog.getByRole("button", { name: "Save" }).click();
	await expect(page.getByRole("button", { name: /saved 1/i })).toBeVisible();
	await dialog.getByRole("button", { name: "Hide" }).click();
	await expect(dialog).toBeHidden();
	await expect(page.locator(".product-card")).toHaveCount(0);
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

test("alerts dialog shows API failure and stays open", async ({ page }) => {
	await page.unroute("**/api/alerts**");
	await page.route("**/api/alerts**", async (route) => {
		if (route.request().method() === "GET") {
			await route.fulfill({ json: { ok: true, alerts: [] } });
			return;
		}
		await route.fulfill({ status: 500, json: { error: "Alert failed" } });
	});

	await page.getByRole("button", { name: /alert me/i }).click();
	const dialog = page.getByRole("dialog");
	await page.getByLabel("Telegram Chat ID").fill("123456789");
	await dialog.getByRole("button", { name: /save alert/i }).click();

	await expect(page.getByText("Alert failed")).toBeVisible();
	await expect(dialog).toBeVisible();
});

test("gallery opens from card photo button", async ({ page }) => {
	await page.locator(".product-card").getByRole("button", { name: "Photos" }).click();
	await expect(page.getByRole("dialog").getByRole("region", { name: "Gallery" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Next photo" })).toBeVisible();
});

test("gallery navigates and closes with keyboard", async ({ page }) => {
	await page.locator(".product-card").getByRole("button", { name: "Photos" }).click();
	const dialog = page.getByRole("dialog");
	await expect(dialog.getByText("1 / 2")).toBeVisible();

	await dialog.getByRole("button", { name: "Next photo" }).click();
	await expect(dialog.getByText("2 / 2")).toBeVisible();

	await page.keyboard.press("ArrowRight");
	await expect(dialog.getByText("1 / 2")).toBeVisible();

	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
});

test("district stats dialog opens with heatmap data", async ({ page }) => {
	await page.getByRole("button", { name: "Stats" }).click();
	await expect(page.getByRole("dialog").getByText("District Stats")).toBeVisible();
	await expect(page.getByRole("dialog").getByRole("cell", { name: "Yasamal" })).toBeVisible();
	await expect(page.getByRole("columnheader", { name: /Avg ₼\/m²/i })).toBeVisible();
});

test("district stats search filters rows and avg sort toggles", async ({ page }) => {
	await page.getByRole("button", { name: "Stats" }).click();
	const dialog = page.locator("dialog#district-stats-modal");
	await expect(dialog.getByRole("cell", { name: "Yasamal" })).toBeVisible();
	await expect(dialog.getByRole("cell", { name: "Nərimanov" })).toBeVisible();

	await dialog.locator("#dst-search").fill("nər");
	await expect(dialog.getByRole("cell", { name: "Nərimanov" })).toBeVisible();
	await expect(dialog.getByRole("cell", { name: "Yasamal" })).toHaveCount(0);

	await dialog.getByRole("button", { name: "Clear search" }).click();
	const avgHeader = dialog.getByRole("columnheader", { name: /Avg ₼\/m²/i });
	await expect(avgHeader).toHaveAttribute("aria-sort", "descending");
	await avgHeader.click();
	await expect(avgHeader).toHaveAttribute("aria-sort", "ascending");
});

test("district stats retries after heatmap failure", async ({ page }) => {
	await page.unroute("**/api/heatmap");
	let requests = 0;
	await page.route("**/api/heatmap", async (route) => {
		requests += 1;
		if (requests === 1) {
			await route.fulfill({ status: 500, json: { error: "failed" } });
			return;
		}
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

	await page.getByRole("button", { name: "Stats" }).click();
	const dialog = page.locator("dialog#district-stats-modal");
	await expect(dialog.getByText("Failed to load stats")).toBeVisible();
	await dialog.getByRole("button", { name: "Retry" }).click();
	await expect(dialog.getByRole("cell", { name: "Yasamal" })).toBeVisible();
});

test("scrape ops dialog opens with empty runs", async ({ page }) => {
	await page.getByRole("button", { name: "Scrape Ops" }).click();
	await expect(page.getByRole("dialog").getByText("Scrape runs", { exact: true })).toBeVisible();
	await expect(page.getByRole("dialog").getByText("No scrape runs yet").first()).toBeVisible();
});

test("scrape ops renders run rows and starts scrape", async ({ page }) => {
	const runRequests: string[] = [];
	await page.unroute("**/api/scrape/runs**");
	await page.route("**/api/scrape/runs**", async (route) => {
		await route.fulfill({
			json: {
				ok: true,
				runs: [
					{
						id: 1,
						status: "completed",
						trigger: "manual",
						started_at: "2026-05-09T10:00:00.000Z",
						finished_at: "2026-05-09T10:01:00.000Z",
						duration_ms: 60000,
						total_found: 12,
						total_fetched: 10,
						total_persisted: 8,
						total_skipped: 2,
						total_errors: 0,
						platform_results: [{ platform: "bina", fetched: 10, persisted: 8 }],
					},
				],
			},
		});
	});
	await page.route("**/api/scrape/run", async (route) => {
		runRequests.push(route.request().headers()["x-scrape-admin-token"] ?? "");
		await route.fulfill({ json: { ok: true } });
	});

	await page.evaluate(() => localStorage.setItem("redeal:scrape-admin-token", "test-token"));
	await page.getByRole("button", { name: "Scrape Ops" }).click();
	const dialog = page.getByRole("dialog");
	await expect(dialog.getByText("completed")).toBeVisible();
	await expect(dialog.getByText("manual")).toBeVisible();
	await expect(dialog.getByText("bina: 8/10")).toBeVisible();

	await dialog.getByRole("button", { name: "Run now" }).click();
	await expect.poll(() => runRequests).toEqual(["test-token"]);
});

test("scrape ops prompts for token after unauthorized run", async ({ page }) => {
	await page.route("**/api/scrape/run", async (route) => {
		await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
	});
	page.on("dialog", async (dialog) => {
		expect(dialog.message()).toBe("Enter scrape admin token");
		await dialog.dismiss();
	});

	await page.getByRole("button", { name: "Scrape Ops" }).click();
	const dialog = page.getByRole("dialog");
	await dialog.getByRole("button", { name: "Run now" }).click();
	await expect(dialog.getByText("Scrape admin token required")).toBeVisible();
});

test("heatmap dialog opens from location map", async ({ page }) => {
	await page.getByRole("button", { name: "Location Map" }).click();
	await expect(page.locator("dialog#heatmap-modal")).toBeVisible();
	await expect(page.locator("#heatmap-map-container .leaflet-pane").first()).toHaveCount(1);
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
	await page.locator("#heatmap-map-container .leaflet-overlay-pane path").first().click({ force: true });

	await expect(dialog).toBeHidden();
	await expect.poll(() => searchUrls.at(-1) ?? "").toContain("location=Yasamal");
	await page.getByRole("button", { name: "Location Map" }).click();
	await expect(page.locator("#heatmap-map-container .leaflet-overlay-pane path[stroke=\"white\"]")).toHaveCount(1);
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
	await expect(page.getByRole("option", { name: "Failed to load locations" })).toBeVisible();
});

test("mobile layout supports filters and detail without overflow", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.getByText("Redeal")).toBeVisible();
	await expect(page.locator(".product-card")).toHaveCount(1);

	await page.getByRole("button", { name: /advanced filters/i }).click();
	await expect(page.locator("#minPrice")).toBeVisible();
	await page.locator(".product-card").click();
	await expect(page.getByRole("dialog").getByText("Bright test apartment")).toBeVisible();

	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > window.innerWidth,
	);
	expect(hasOverflow).toBe(false);
});
