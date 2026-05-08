import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "";
const allowReset = process.env.TEST_SEED_ALLOW_RESET === "1";

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required");
}

if (!allowReset && !/test|redeal_test|localhost|127\.0\.0\.1/i.test(databaseUrl)) {
	throw new Error(
		"Refusing to reset database. Use a test DATABASE_URL or set TEST_SEED_ALLOW_RESET=1.",
	);
}

const prisma = new PrismaClient();
const now = new Date("2026-02-15T12:00:00.000Z");
const previous = new Date("2026-01-15T12:00:00.000Z");

await prisma.$transaction(async (tx) => {
	await tx.priceHistory.deleteMany();
	await tx.alert.deleteMany();
	await tx.scrapeRun.deleteMany();
	await tx.property.deleteMany();

	const properties = await Promise.all([
		tx.property.create({
			data: {
				source_url: "https://test.redeal.local/yasamal-deal",
				price: 120000,
				area_sqm: 80,
				price_per_sqm: 1500,
				district: "Yasamal",
				location_name: "Yasamal",
				latitude: 40.377,
				longitude: 49.837,
				rooms: 3,
				floor: 4,
				total_floors: 12,
				category: "Yeni tikili",
				has_document: true,
				has_mortgage: false,
				has_repair: true,
				has_active_mortgage: false,
				is_urgent: true,
				price_drop_count: 1,
				description: "Bright corner apartment near metro",
				image_urls: ["https://example.com/yasamal.jpg"],
				posted_date: now,
			},
		}),
		tx.property.create({
			data: {
				source_url: "https://test.redeal.local/yasamal-average-1",
				price: 160000,
				area_sqm: 80,
				price_per_sqm: 2000,
				district: "Yasamal",
				location_name: "Yasamal",
				latitude: 40.378,
				longitude: 49.838,
				rooms: 2,
				floor: 5,
				total_floors: 12,
				category: "Yeni tikili",
				has_document: true,
				has_mortgage: true,
				has_repair: false,
				description: "Average market listing",
				image_urls: [],
				posted_date: previous,
			},
		}),
		tx.property.create({
			data: {
				source_url: "https://test.redeal.local/yasamal-average-2",
				price: 189000,
				area_sqm: 90,
				price_per_sqm: 2100,
				district: "Yasamal",
				location_name: "Yasamal",
				latitude: 40.379,
				longitude: 49.839,
				rooms: 3,
				floor: 6,
				total_floors: 12,
				category: "Yeni tikili",
				has_document: false,
				has_mortgage: true,
				has_repair: true,
				description: "Average repaired listing",
				image_urls: [],
				posted_date: previous,
			},
		}),
		tx.property.create({
			data: {
				source_url: "https://test.redeal.local/yasamal-average-3",
				price: 133000,
				area_sqm: 70,
				price_per_sqm: 1900,
				district: "Yasamal",
				location_name: "Yasamal",
				latitude: 40.38,
				longitude: 49.84,
				rooms: 2,
				floor: 7,
				total_floors: 12,
				category: "Köhnə tikili",
				has_document: true,
				has_mortgage: false,
				has_repair: false,
				description: "Older average listing",
				image_urls: [],
				posted_date: previous,
			},
		}),
		tx.property.create({
			data: {
				source_url: "https://test.redeal.local/narimanov-deal",
				price: 147000,
				area_sqm: 70,
				price_per_sqm: 2100,
				district: "Nərimanov",
				location_name: "Nərimanov",
				latitude: 40.405,
				longitude: 49.87,
				rooms: 2,
				floor: 3,
				total_floors: 16,
				category: "Köhnə tikili",
				has_document: false,
				has_mortgage: true,
				has_active_mortgage: true,
				has_repair: false,
				description: "Mortgage listing with park view",
				image_urls: ["https://example.com/narimanov.jpg"],
				posted_date: now,
			},
		}),
		tx.property.create({
			data: {
				source_url: "https://test.redeal.local/narimanov-average-1",
				price: 240000,
				area_sqm: 80,
				price_per_sqm: 3000,
				district: "Nərimanov",
				location_name: "Nərimanov",
				latitude: 40.406,
				longitude: 49.871,
				rooms: 3,
				floor: 8,
				total_floors: 16,
				category: "Yeni tikili",
				has_document: true,
				has_mortgage: true,
				has_repair: true,
				description: "Premium average listing",
				image_urls: [],
				posted_date: previous,
			},
		}),
		tx.property.create({
			data: {
				source_url: "https://test.redeal.local/narimanov-average-2",
				price: 279000,
				area_sqm: 90,
				price_per_sqm: 3100,
				district: "Nərimanov",
				location_name: "Nərimanov",
				latitude: 40.407,
				longitude: 49.872,
				rooms: 4,
				floor: 9,
				total_floors: 16,
				category: "Yeni tikili",
				has_document: true,
				has_mortgage: false,
				has_repair: true,
				description: "Premium market listing",
				image_urls: [],
				posted_date: previous,
			},
		}),
		tx.property.create({
			data: {
				source_url: "https://test.redeal.local/narimanov-average-3",
				price: 174000,
				area_sqm: 60,
				price_per_sqm: 2900,
				district: "Nərimanov",
				location_name: "Nərimanov",
				latitude: 40.408,
				longitude: 49.873,
				rooms: 2,
				floor: 10,
				total_floors: 16,
				category: "Köhnə tikili",
				has_document: false,
				has_mortgage: false,
				has_repair: false,
				description: "Secondary market listing",
				image_urls: [],
				posted_date: previous,
			},
		}),
	]);

	const yasamalDeal = properties[0];
	if (!yasamalDeal) throw new Error("Missing seeded Yasamal deal");
	await tx.priceHistory.createMany({
		data: [
			{
				property_id: yasamalDeal.id,
				price: 140000,
				price_per_sqm: 1750,
				recorded_at: previous,
			},
			{
				property_id: yasamalDeal.id,
				price: 120000,
				price_per_sqm: 1500,
				recorded_at: now,
			},
		],
	});

	await tx.alert.create({
		data: {
			chat_id: "123456789",
			label: "Seeded Yasamal alert",
			filters: { location: "Yasamal", threshold: 10 },
		},
	});

	await tx.scrapeRun.create({
		data: {
			trigger: "manual",
			status: "success",
			started_at: previous,
			finished_at: now,
			duration_ms: 1000,
			total_fetched: properties.length,
			total_persisted: properties.length,
			options: { seed: true },
			platform_results: [{ platform: "seed", fetched: properties.length }],
		},
	});
});

await prisma.$disconnect();
console.log("Seeded test database with deterministic Redeal fixtures.");
