import type { Page } from "@playwright/test";

export const deal = {
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

export const cheaperDeal = {
	...deal,
	source_url: "https://example.com/deal-2",
	price: 90000,
	price_per_sqm: 1200,
	discount_percent: 15,
	tier: "Good Deal",
	description: "Lower priced test apartment",
	image_urls: [],
};

export const heatmapData = [
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
	{
		location_name: "Nərimanov",
		avg_price_per_sqm: 2500,
		count: 8,
		lat: 40.409,
		lng: 49.867,
		recent_avg: 2450,
		prior_avg: 2500,
		trend: "down",
	},
];

type MockApiOptions = {
	searchUrls?: string[];
	undervalued?: unknown;
	heatmap?: unknown;
	heatmapStatus?: number;
	alertsStatus?: number;
	alertsError?: string;
	locationsStatus?: number;
	locations?: string[];
};

export async function mockApi(page: Page, options: MockApiOptions = {}) {
	await page.route("https://*.basemaps.cartocdn.com/**", async (route) => {
		await route.fulfill({ status: 204, body: "" });
	});
	await page.route("**/api/deals/locations", async (route) => {
		if (options.locationsStatus && options.locationsStatus >= 400) {
			await route.fulfill({ status: options.locationsStatus, json: { error: "failed" } });
			return;
		}
		await route.fulfill({ json: { data: options.locations ?? ["Yasamal", "Nərimanov"] } });
	});
	await page.route("**/api/deals/undervalued**", async (route) => {
		options.searchUrls?.push(route.request().url());
		await route.fulfill({
			json:
				options.undervalued ??
				{
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
			status: options.heatmapStatus ?? 200,
			json: options.heatmap ?? { data: heatmapData },
		});
	});
	await page.route("**/api/alerts**", async (route) => {
		if (route.request().method() === "GET") {
			await route.fulfill({ json: { ok: true, alerts: [] } });
			return;
		}
		if (options.alertsStatus && options.alertsStatus >= 400) {
			await route.fulfill({
				status: options.alertsStatus,
				json: { error: options.alertsError ?? "Alert failed" },
			});
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
