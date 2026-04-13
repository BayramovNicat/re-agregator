import { html } from "../core/utils";

const INPUT_CLS = `
  w-full px-2.5 py-1.75
  bg-(--surface-2) border border-(--border) rounded-(--r-sm)
  text-(--text) font-inherit text-sm
  transition-[border-color,box-shadow] duration-150
  placeholder:text-(--muted)
  hover:border-(--border-h)
  focus:outline-none focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-dim)]
`;

const LABEL_CLS = `
  text-xs font-medium text-(--muted)
  tracking-[0.06em] uppercase
`;

const CHIP_SPAN_CLS = `
  inline-flex items-center gap-1.5
  px-3 py-1.25 rounded-full
  border border-(--border)
  text-(--text-2) text-xs font-medium
  transition-all duration-150
  group-hover:border-(--border-h) group-hover:text-(--text)
  peer-checked:border-[rgba(99,102,241,0.5)] 
  peer-checked:text-(--accent) peer-checked:bg-(--accent-dim)
  before:content-[''] before:w-1.25 before:h-1.25 before:rounded-full before:bg-(--muted)
  before:transition-[background] before:duration-150
  peer-checked:before:bg-(--accent)
`;

export const NUM_FILTERS: {
	id: string;
	label: string;
	placeholder: string;
	chipLabel: string;
}[] = [
	{
		id: "minPrice",
		label: "Min price (₼)",
		placeholder: "30 000",
		chipLabel: "Min ₼",
	},
	{
		id: "maxPrice",
		label: "Max price (₼)",
		placeholder: "150 000",
		chipLabel: "Max ₼",
	},
	{
		id: "minPriceSqm",
		label: "Min ₼/m²",
		placeholder: "500",
		chipLabel: "Min ₼/m²",
	},
	{
		id: "maxPriceSqm",
		label: "Max ₼/m²",
		placeholder: "2000",
		chipLabel: "Max ₼/m²",
	},
	{
		id: "minArea",
		label: "Min area (m²)",
		placeholder: "40",
		chipLabel: "Min m²",
	},
	{
		id: "maxArea",
		label: "Max area (m²)",
		placeholder: "120",
		chipLabel: "Max m²",
	},
	{
		id: "minRooms",
		label: "Min rooms",
		placeholder: "2",
		chipLabel: "Min rooms",
	},
	{
		id: "maxRooms",
		label: "Max rooms",
		placeholder: "4",
		chipLabel: "Max rooms",
	},
	{
		id: "minFloor",
		label: "Min floor",
		placeholder: "2",
		chipLabel: "Min flr",
	},
	{
		id: "maxFloor",
		label: "Max floor",
		placeholder: "15",
		chipLabel: "Max flr",
	},
	{
		id: "minTotalFloors",
		label: "Min building floors",
		placeholder: "2",
		chipLabel: "Min bldg flr",
	},
	{
		id: "maxTotalFloors",
		label: "Max building floors",
		placeholder: "5",
		chipLabel: "Max bldg flr",
	},
];

export const CHECK_FILTERS: { id: string; label: string }[] = [
	{ id: "hasRepair", label: "Repaired" },
	{ id: "hasDocument", label: "Has document" },
	{ id: "hasMortgage", label: "Mortgage eligible" },
	{ id: "isUrgent", label: "Urgent only" },
	{ id: "notLastFloor", label: "Not last floor" },
	{ id: "noActiveMortgage", label: "No active mortgage" },
	{ id: "hasActiveMortgage", label: "Active mortgage only" },
];

export function renderFilters(panel: HTMLElement): void {
	const grid = html`<div
    class="grid grid-cols-4 gap-2.5 pt-4 border-t border-(--border) mt-3.5 max-[680px]:grid-cols-2"
  ></div>`;

	for (const f of NUM_FILTERS) {
		grid.appendChild(
			html`<div class="flex flex-col gap-1.5">
        <label for="${f.id}" class="${LABEL_CLS}">${f.label}</label>
        <input
          type="number"
          id="${f.id}"
          class="${INPUT_CLS}"
          placeholder="${f.placeholder}"
        />
      </div>`,
		);
	}

	grid.appendChild(
		html`<div class="flex flex-col gap-1.5">
      <label for="category" class="${LABEL_CLS}">Category</label>
      <select
        id="category"
        class="w-full px-2.5 py-1.75 bg-(--surface-2) border border-(--border) rounded-(--r-sm) text-(--text) font-inherit text-sm appearance-none cursor-pointer transition-[border-color] duration-150 focus:outline-none focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-dim)]"
      >
        <option value="">Any</option>
        <option value="Yeni tikili">New build</option>
        <option value="Köhnə tikili">Secondary</option>
      </select>
    </div>`,
	);

	const pills = html`<div class="flex flex-wrap gap-1.75 pt-3.5"></div>`;

	for (const f of CHECK_FILTERS) {
		pills.appendChild(
			html`<label class="group inline-flex cursor-pointer select-none">
        <input
          type="checkbox"
          id="${f.id}"
          class="peer absolute opacity-0 w-0 h-0"
        />
        <span class="${CHIP_SPAN_CLS}">${f.label}</span>
      </label>`,
		);
	}

	panel.appendChild(grid);
	panel.appendChild(pills);
}
