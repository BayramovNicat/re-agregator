import { prisma } from "../src/utils/prisma";

const DRY_RUN = process.argv.includes("--dry-run");

const mappings = [
	["Yeni tikili", "new"],
	["Köhnə tikili", "old"],
	["Həyət evi/Bağ evi", "house"],
] as const;

try {
	const results = [];

	for (const [from, to] of mappings) {
		const count = await prisma.property.count({ where: { category: from } });

		if (!DRY_RUN && count > 0) {
			await prisma.$executeRaw`
				UPDATE "Property"
				SET category = ${to}, updated_at = updated_at
				WHERE category = ${from}
			`;
		}

		results.push({ from, to, count });
	}

	const remaining = await prisma.$queryRaw<
		Array<{ category: string; count: bigint }>
	>`
		SELECT category, COUNT(*) AS count
		FROM "Property"
		WHERE category IS NOT NULL
		GROUP BY category
		ORDER BY count DESC
	`;

	console.log(
		JSON.stringify(
			{
				dryRun: DRY_RUN,
				mapped: results,
				categories: remaining.map((row) => ({
					category: row.category,
					count: Number(row.count),
				})),
			},
			null,
			2,
		),
	);
} finally {
	await prisma.$disconnect();
}
