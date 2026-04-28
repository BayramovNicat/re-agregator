import { t } from "../../core/i18n";

export const getNumericFilters = () =>
	[
		{
			id: "minPrice",
			label: t("minPrice"),
			placeholder: "30 000",
			chipLabel: t("chipMinPrice"),
		},
		{
			id: "maxPrice",
			label: t("maxPrice"),
			placeholder: "150 000",
			chipLabel: t("chipMaxPrice"),
		},
		{
			id: "minPriceSqm",
			label: t("minPriceSqm"),
			placeholder: "500",
			chipLabel: t("chipMinPriceSqm"),
		},
		{
			id: "maxPriceSqm",
			label: t("maxPriceSqm"),
			placeholder: "2000",
			chipLabel: t("chipMaxPriceSqm"),
		},
		{
			id: "minArea",
			label: t("minArea"),
			placeholder: "40",
			chipLabel: t("chipMinArea"),
		},
		{
			id: "maxArea",
			label: t("maxArea"),
			placeholder: "120",
			chipLabel: t("chipMaxArea"),
		},
		{
			id: "minRooms",
			label: t("minRooms"),
			placeholder: "2",
			chipLabel: t("chipMinRooms"),
		},
		{
			id: "maxRooms",
			label: t("maxRooms"),
			placeholder: "4",
			chipLabel: t("chipMaxRooms"),
		},
		{
			id: "minFloor",
			label: t("minFloor"),
			placeholder: "2",
			chipLabel: t("chipMinFloor"),
		},
		{
			id: "maxFloor",
			label: t("maxFloor"),
			placeholder: "15",
			chipLabel: t("chipMaxFloor"),
		},
		{
			id: "minTotalFloors",
			label: t("minTotalFloors"),
			placeholder: "2",
			chipLabel: t("chipMinTotalFloors"),
		},
		{
			id: "maxTotalFloors",
			label: t("maxTotalFloors"),
			placeholder: "5",
			chipLabel: t("chipMaxTotalFloors"),
		},
	] as const;

export const getBooleanFilters = () =>
	[
		{ id: "hasRepair", label: t("hasRepair") },
		{ id: "hasDocument", label: t("hasDocument") },
		{ id: "hasMortgage", label: t("hasMortgage") },
		{ id: "isUrgent", label: t("isUrgent") },
		{ id: "notLastFloor", label: t("notLastFloor") },
	] as const;
