import { afterEach, describe, expect, test } from "bun:test";
import { BinaScraper } from "../src/scrapers/bina.scraper.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("BinaScraper", () => {
	test("retries transient GraphQL failures with timeout signals", async () => {
		const calls: RequestInit[] = [];
		globalThis.fetch = (async (_url, init) => {
			calls.push(init ?? {});

			if (calls.length === 1) {
				return new Response("upstream error", { status: 500 });
			}

			return Response.json({
				data: {
					i123: {
						title: "listing",
						description: "description",
						updatedAt: "2026-05-09T00:00:00Z",
						category: null,
						latitude: null,
						longitude: null,
						photos: [{ full: "https://example.test/photo.jpg" }],
					},
				},
			});
		}) as typeof fetch;

		const result = await new BinaScraper().fetchImageUrls(["123"]);

		expect(result).toEqual({ "123": ["https://example.test/photo.jpg"] });
		expect(calls).toHaveLength(2);
		expect(calls.every((call) => call.signal instanceof AbortSignal)).toBe(true);
	});
});
