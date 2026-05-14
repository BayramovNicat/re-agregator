import { prisma } from "../src/utils/prisma";
import { detectActiveMortgage } from "../src/scrapers/base.scraper";

const BATCH_SIZE = 500;

let cursor: number | undefined;
let scanned = 0;
let changedToTrue = 0;
let changedToFalse = 0;

try {
	while (true) {
		const properties = await prisma.property.findMany({
			select: {
				id: true,
				description: true,
				has_active_mortgage: true,
			},
			orderBy: { id: "asc" },
			take: BATCH_SIZE,
			...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
		});

		if (properties.length === 0) break;

		const updates = properties
			.map((property) => ({
				id: property.id,
				hasActiveMortgage: detectActiveMortgage(property.description ?? ""),
				currentHasActiveMortgage: property.has_active_mortgage,
			}))
			.filter(
				(property) =>
					property.hasActiveMortgage !== property.currentHasActiveMortgage,
			);

		if (updates.length > 0) {
			await prisma.$transaction(
				updates.map((property) =>
					prisma.property.update({
						where: { id: property.id },
						data: { has_active_mortgage: property.hasActiveMortgage },
					}),
				),
			);
		}

		for (const update of updates) {
			if (update.hasActiveMortgage) changedToTrue += 1;
			else changedToFalse += 1;
		}

		scanned += properties.length;
		cursor = properties.at(-1)?.id;
	}

	console.log(
		JSON.stringify(
			{
				scanned,
				updated: changedToTrue + changedToFalse,
				changedToTrue,
				changedToFalse,
			},
			null,
			2,
		),
	);
} finally {
	await prisma.$disconnect();
}
