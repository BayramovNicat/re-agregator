export const PROPERTY_CATEGORIES = ["new", "old", "house"] as const;

export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];

const BINA_TO_CATEGORY: Record<string, PropertyCategory> = {
	"Yeni tikili": "new",
	"Köhnə tikili": "old",
	"Həyət evi/Bağ evi": "house",
};

export function normalizePropertyCategory(
	category: string | null | undefined,
): PropertyCategory | undefined {
	if (!category) return undefined;
	if (PROPERTY_CATEGORIES.includes(category as PropertyCategory)) {
		return category as PropertyCategory;
	}
	return BINA_TO_CATEGORY[category];
}
