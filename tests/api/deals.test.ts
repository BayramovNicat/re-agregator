import { beforeAll, describe, expect, test } from "bun:test";

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
let serverAvailable = false;
let seedAvailable = false;

beforeAll(async () => {
	try {
		const res = await fetch(`${baseUrl}/health`);
		serverAvailable = res.ok;
		if (!serverAvailable) return;

		const seedRes = await fetch(`${baseUrl}/api/deals/by-urls`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ urls: ["https://test.redeal.local/yasamal-deal"] }),
		});
		const seedBody = (await seedRes.json()) as { data?: unknown[] };
		seedAvailable = seedRes.ok && (seedBody.data?.length ?? 0) > 0;
	} catch {
		serverAvailable = false;
		seedAvailable = false;
	}
});

function skipIfNoServer() {
	if (!serverAvailable) {
		console.warn(`Skipping API test: no server at ${baseUrl}`);
		return true;
	}
	return false;
}

function skipIfNoSeed() {
	if (skipIfNoServer()) return true;
	if (!seedAvailable) {
		console.warn("Skipping seeded API test: run `bun run test:seed` first.");
		return true;
	}
	return false;
}

async function getJson(path: string) {
	const res = await fetch(`${baseUrl}${path}`);
	let body: unknown = null;
	try {
		body = await res.json();
	} catch {}
	return { res, body };
}

describe("public API", () => {
	test("health returns status and property count", async () => {
		if (skipIfNoServer()) return;
		const { res, body } = await getJson("/health");

		expect(res.status).toBe(200);
		expect(body).toMatchObject({ status: "ok" });
		expect(typeof (body as { timestamp?: unknown }).timestamp).toBe("string");
		expect(typeof (body as { properties?: unknown }).properties).toBe("number");
	});

	test("locations returns an array", async () => {
		if (skipIfNoServer()) return;
		const { res, body } = await getJson("/api/deals/locations");

		expect(res.status).toBe(200);
		expect(Array.isArray((body as { data?: unknown }).data)).toBe(true);
	});

	test("undervalued deals returns paginated shape", async () => {
		if (skipIfNoServer()) return;
		const { res, body } = await getJson(
			"/api/deals/undervalued?location=__all__&threshold=10&limit=20&offset=0&sort=disc",
		);

		expect(res.status).toBe(200);
		expect(body).toMatchObject({
			location: "__all__",
			threshold_pct: 10,
			limit: 20,
			offset: 0,
		});
		expect(Array.isArray((body as { data?: unknown }).data)).toBe(true);
		expect(typeof (body as { count?: unknown }).count).toBe("number");
		expect(typeof (body as { total?: unknown }).total).toBe("number");
	});

	test("undervalued deals requires location", async () => {
		if (skipIfNoServer()) return;
		const { res } = await getJson("/api/deals/undervalued");

		expect(res.status).toBe(400);
	});

	test("undervalued deals rejects invalid threshold", async () => {
		if (skipIfNoServer()) return;
		const { res } = await getJson(
			"/api/deals/undervalued?location=__all__&threshold=101",
		);

		expect(res.status).toBe(400);
	});

	test("undervalued deals rejects invalid sort", async () => {
		if (skipIfNoServer()) return;
		const { res } = await getJson(
			"/api/deals/undervalued?location=__all__&sort=bad",
		);

		expect(res.status).toBe(400);
	});

	test("map pins returns count and data", async () => {
		if (skipIfNoServer()) return;
		const { res, body } = await getJson(
			"/api/deals/map-pins?location=__all__&threshold=10",
		);

		expect(res.status).toBe(200);
		expect(typeof (body as { count?: unknown }).count).toBe("number");
		expect(Array.isArray((body as { data?: unknown }).data)).toBe(true);
	});

	test("trend requires location", async () => {
		if (skipIfNoServer()) return;
		const { res } = await getJson("/api/deals/trend");

		expect(res.status).toBe(400);
	});

	test("by-urls rejects empty URL list", async () => {
		if (skipIfNoServer()) return;
		const res = await fetch(`${baseUrl}/api/deals/by-urls`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ urls: [] }),
		});

		expect(res.status).toBe(400);
	});

	test("seeded location filter returns only selected location", async () => {
		if (skipIfNoSeed()) return;
		const { res, body } = await getJson(
			"/api/deals/undervalued?location=Yasamal&threshold=10&limit=20&offset=0",
		);

		expect(res.status).toBe(200);
		const data = (body as { data: Array<{ location_name: string }> }).data;
		expect(data.length).toBeGreaterThan(0);
		expect(data.every((deal) => deal.location_name === "Yasamal")).toBe(true);
	});

	test("seeded category and boolean filters narrow results", async () => {
		if (skipIfNoSeed()) return;
		const { res, body } = await getJson(
			"/api/deals/undervalued?location=__all__&threshold=0&category=Yeni%20tikili&hasDocument=true&hasRepair=true&limit=20&offset=0",
		);

		expect(res.status).toBe(200);
		const data = (
			body as {
				data: Array<{
					category: string;
					has_document: boolean;
					has_repair: boolean;
				}>;
			}
		).data;
		expect(data.length).toBeGreaterThan(0);
		expect(
			data.every(
				(deal) =>
					deal.category === "Yeni tikili" &&
					deal.has_document === true &&
					deal.has_repair === true,
			),
		).toBe(true);
	});

	test("seeded numeric filters return expected deal", async () => {
		if (skipIfNoSeed()) return;
		const { res, body } = await getJson(
			"/api/deals/undervalued?location=Yasamal&threshold=0&minPrice=110000&maxPrice=130000&minRooms=3&maxRooms=3&limit=20&offset=0",
		);

		expect(res.status).toBe(200);
		const data = (
			body as { data: Array<{ source_url: string; price: string; rooms: number }> }
		).data;
		expect(data.map((deal) => deal.source_url)).toContain(
			"https://test.redeal.local/yasamal-deal",
		);
		expect(
			data.every(
				(deal) => Number(deal.price) >= 110000 && Number(deal.price) <= 130000,
			),
		).toBe(true);
	});

	test("seeded sort by price ascending is ordered", async () => {
		if (skipIfNoSeed()) return;
		const { res, body } = await getJson(
			"/api/deals/undervalued?location=__all__&threshold=0&sort=price-asc&limit=20&offset=0",
		);

		expect(res.status).toBe(200);
		const prices = (body as { data: Array<{ price: string }> }).data.map((deal) =>
			Number(deal.price),
		);
		expect(prices.length).toBeGreaterThan(1);
		expect(prices).toEqual([...prices].sort((a, b) => a - b));
	});

	test("seeded alerts can be created, listed, and deleted", async () => {
		if (skipIfNoSeed()) return;
		const createRes = await fetch(`${baseUrl}/api/alerts`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				chat_id: "987654321",
				label: "API test alert",
				filters: { location: "Yasamal", threshold: 10 },
			}),
		});
		expect(createRes.status).toBe(200);
		const created = (await createRes.json()) as { token: string };
		expect(typeof created.token).toBe("string");

		const list = await getJson("/api/alerts?chat_id=987654321");
		expect(list.res.status).toBe(200);
		expect(
			(list.body as { alerts: Array<{ token: string }> }).alerts.some(
				(alert) => alert.token === created.token,
			),
		).toBe(true);

		const deleteRes = await fetch(`${baseUrl}/api/alerts/${created.token}`, {
			method: "DELETE",
		});
		expect(deleteRes.status).toBe(200);
	});
});
