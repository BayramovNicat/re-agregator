/**
 * Backfill script: fetch image URLs for all existing Property rows that have none.
 *
 * Reads properties in batches, extracts item IDs from source_url,
 * calls bina.az GraphQL for images, and updates the DB.
 *
 * Run:
 *   bun run backfill:images
 *
 * Re-run safe: only processes rows where image_urls = '{}' (empty array).
 */

import { BinaScraper } from "./scrapers/bina.scraper.js";
import { prisma } from "./utils/prisma.js";

const BATCH_SIZE = 50; // keep batched GraphQL query small
const DELAY_MS = 800;

function extractItemId(sourceUrl: string): string | null {
	const match = sourceUrl.match(/\/items\/(\d+)/);
	return match?.[1] ?? null;
}

async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
	const scraper = new BinaScraper();

	type Row = { id: number; source_url: string };

	const [{ total }] = await prisma.$queryRaw<[{ total: bigint }]>`
		SELECT COUNT(*) AS total FROM "Property" WHERE image_urls IS NULL
	`;
	const totalCount = Number(total);
	console.log(`[backfill:images] Properties without images: ${totalCount}`);

	if (totalCount === 0) {
		console.log("[backfill:images] Nothing to do.");
		await prisma.$disconnect();
		return;
	}

	let processed = 0;
	let updated = 0;
	let skipped = 0;

	while (true) {
		// Always OFFSET 0 — updated rows leave the IS NULL set so the window shifts naturally
		const rows = await prisma.$queryRaw<Row[]>`
			SELECT id, source_url FROM "Property"
			WHERE image_urls IS NULL
			ORDER BY id ASC
			LIMIT ${BATCH_SIZE}
		`;

		if (rows.length === 0) break;

		const idMap = new Map<string, number>(); // itemId → property.id
		for (const row of rows) {
			const itemId = extractItemId(row.source_url);
			if (itemId) idMap.set(itemId, row.id);
			else skipped++;
		}

		if (idMap.size > 0) {
			const imageMap = await scraper.fetchImageUrls([...idMap.keys()]);

			for (const [itemId, propertyId] of idMap) {
				const urls = imageMap[itemId];
				// Set to empty array if listing has no photos so it leaves the IS NULL set
				await prisma.property.update({
					where: { id: propertyId },
					data: { image_urls: urls ?? [] },
				});
				if (urls?.length) updated++;
			}
		}

		processed += rows.length;
		console.log(
			`[backfill:images] ${processed}/${totalCount} processed, ${updated} with images, ${skipped} skipped`,
		);

		await delay(DELAY_MS);
	}

	console.log(
		`[backfill:images] Done. ${updated} updated, ${skipped} skipped (bad URL).`,
	);
	await prisma.$disconnect();
}

main().catch((err) => {
	console.error("[backfill:images] Fatal:", err);
	process.exit(1);
});
