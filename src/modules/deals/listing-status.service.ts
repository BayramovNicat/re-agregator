import { prisma } from "@/utils/prisma.js";

const BINA_GRAPHQL_URL = "https://bina.az/graphql";
const BINA_ITEM_RE = /^https:\/\/(?:www\.)?bina\.az\/items\/(\d+)(?:[/?#].*)?$/;
const ENDED_MARKERS = [
	"Bu elanın müddəti başa çatıb",
	"Bu elanin muddeti basa catib",
	"Müddəti başa çatıb:",
];

type ListingStatus = {
	url: string;
	ended: boolean;
	deleted: boolean;
	expiresAt: string | null;
	source: "graphql" | "html" | "missing";
};

type BatchListingStatus = {
	checked: number;
	ended: number;
	deleted: number;
	failed: number;
};

const BATCH_GRAPHQL_SIZE = 80;
const BATCH_GRAPHQL_CONCURRENCY = 3;

type GraphQLResponse<T> = {
	data?: T;
	errors?: Array<{ message: string; path?: unknown[] }>;
};

type BinaItemStatus = {
	item: { id: string; expiresAt: string | null } | null;
};

type BinaBatchItemStatus = {
	id: string;
	expiresAt: string | null;
} | null;

export function getBinaItemId(url: string): string | null {
	return url.match(BINA_ITEM_RE)?.[1] ?? null;
}

export async function checkAndDeleteEndedListing(
	url: string,
): Promise<ListingStatus> {
	const itemId = getBinaItemId(url);
	if (!itemId) {
		throw new Error("Only bina.az item URLs are supported");
	}

	const gql = await fetchBinaGraphQLStatus(itemId);
	if (!gql.item) {
		return deleteIfNeeded({
			url,
			ended: true,
			deleted: false,
			expiresAt: null,
			source: "missing",
		});
	}

	if (gql.item.expiresAt && Date.parse(gql.item.expiresAt) <= Date.now()) {
		return deleteIfNeeded({
			url,
			ended: true,
			deleted: false,
			expiresAt: gql.item.expiresAt,
			source: "graphql",
		});
	}

	const htmlEnded = await fetchBinaHtmlEnded(url);
	if (htmlEnded) {
		return deleteIfNeeded({
			url,
			ended: true,
			deleted: false,
			expiresAt: gql.item.expiresAt,
			source: "html",
		});
	}

	return {
		url,
		ended: false,
		deleted: false,
		expiresAt: gql.item.expiresAt,
		source: "graphql",
	};
}

export async function checkAndDeleteEndedListings(
	urls: string[],
): Promise<BatchListingStatus> {
	const entries = Array.from(
		new Map<string, string>(
			urls
				.map((url): [string | null, string] => [getBinaItemId(url), url])
				.filter((entry): entry is [string, string] => entry[0] !== null),
		).entries(),
	);
	const chunks = chunk(entries, BATCH_GRAPHQL_SIZE);
	let checked = 0;
	let ended = 0;
	let failed = 0;
	const endedUrls = new Set<string>();
	let index = 0;

	async function worker(): Promise<void> {
		while (index < chunks.length) {
			const batch = chunks[index++];
			if (!batch) continue;
			try {
				const statuses = await fetchBinaGraphQLStatuses(
					batch.map(([id]) => id),
				);
				checked += batch.length;
				for (const [id, url] of batch) {
					const item = statuses[`i${id}`] ?? null;
					if (
						!item ||
						(item.expiresAt && Date.parse(item.expiresAt) <= Date.now())
					) {
						ended++;
						endedUrls.add(url);
					}
				}
			} catch (err) {
				failed += batch.length;
				console.warn("[ListingStatus] GraphQL batch check failed:", err);
			}
		}
	}

	await Promise.all(
		Array.from(
			{ length: Math.min(BATCH_GRAPHQL_CONCURRENCY, chunks.length) },
			() => worker(),
		),
	);

	const deleted = endedUrls.size
		? await prisma.property.deleteMany({
				where: { source_url: { in: [...endedUrls] } },
			})
		: { count: 0 };

	return { checked, ended, deleted: deleted.count, failed };
}

async function deleteIfNeeded(status: ListingStatus): Promise<ListingStatus> {
	const deleted = await prisma.property.deleteMany({
		where: { source_url: status.url },
	});
	return { ...status, deleted: deleted.count > 0 };
}

async function fetchBinaGraphQLStatus(itemId: string): Promise<BinaItemStatus> {
	const query = /* graphql */ `
		query ItemStatus($id: ID!) {
			item(id: $id) { id expiresAt }
		}
	`;

	const resp = await fetch(BINA_GRAPHQL_URL, {
		method: "POST",
		headers: binaHeaders(`https://bina.az/items/${itemId}`),
		body: JSON.stringify({ query, variables: { id: itemId } }),
		signal: AbortSignal.timeout(10_000),
	});

	if (!resp.ok) {
		throw new Error(`bina.az GraphQL returned HTTP ${resp.status}`);
	}

	const json = (await resp.json()) as GraphQLResponse<BinaItemStatus>;
	if (json.errors?.length && !json.data) {
		throw new Error(json.errors[0]?.message ?? "bina.az GraphQL error");
	}
	return json.data ?? { item: null };
}

async function fetchBinaGraphQLStatuses(
	itemIds: string[],
): Promise<Record<string, BinaBatchItemStatus>> {
	const fields = itemIds
		.map((id) => `i${id}: item(id: "${id}") { id expiresAt }`)
		.join("\n");
	const resp = await fetch(BINA_GRAPHQL_URL, {
		method: "POST",
		headers: binaHeaders(),
		body: JSON.stringify({ query: `{ ${fields} }` }),
		signal: AbortSignal.timeout(15_000),
	});

	if (!resp.ok) {
		throw new Error(`bina.az GraphQL returned HTTP ${resp.status}`);
	}

	const json = (await resp.json()) as GraphQLResponse<
		Record<string, BinaBatchItemStatus>
	>;
	if (json.errors?.some((error) => !error.path) && !json.data) {
		throw new Error(json.errors[0]?.message ?? "bina.az GraphQL error");
	}
	return json.data ?? {};
}

function binaHeaders(referer = "https://bina.az/"): Record<string, string> {
	return {
		"Content-Type": "application/json",
		"User-Agent":
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
		Accept: "application/json, text/plain, */*",
		Origin: "https://bina.az",
		Referer: referer,
		"Accept-Language": "az-AZ,az;q=0.9,en;q=0.8",
	};
}

function chunk<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
}

async function fetchBinaHtmlEnded(url: string): Promise<boolean> {
	const resp = await fetch(url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Accept-Language": "az-AZ,az;q=0.9,en;q=0.8",
		},
		signal: AbortSignal.timeout(10_000),
	});

	if (!resp.ok) return resp.status === 404 || resp.status === 410;
	const html = await resp.text();
	return ENDED_MARKERS.some((marker) => html.includes(marker));
}
