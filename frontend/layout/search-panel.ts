import { html } from "../core/utils";
import { Icons } from "../ui/icons";
import { Label } from "../ui/label";
import { Range } from "../ui/range";

export function renderSearchPanel(container: HTMLElement): void {
  container.appendChild(
    html`<div
      class="bg-(--surface) border border-(--border) rounded-(--r-lg) p-5 mb-3.5"
    >
      <div
        class="grid grid-cols-[1fr_260px_120px] gap-3 items-end max-[680px]:grid-cols-1"
      >
        <div class="flex flex-col gap-1.5">
          ${Label({ htmlFor: "loc", text: "Location" })}
          <select
            id="loc"
            class="w-full px-3 py-2.25 bg-(--surface-2) border border-(--border) rounded-(--r) text-(--text) font-inherit text-sm appearance-none cursor-pointer transition-[border-color,box-shadow] duration-150 hover:border-(--border-h) focus:outline-none focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-dim)]"
          >
            <option value="" disabled selected>Loading locations…</option>
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            ${Label({ htmlFor: "thresh", text: "Discount threshold" })}
            <span
              id="tval"
              class="text-xs font-bold text-(--accent) bg-(--accent-dim) px-2 py-0.5 rounded-full tracking-[0.02em]"
              >10%</span
            >
          </div>
          ${Range({
						id: "thresh",
						min: 1,
						max: 50,
						value: 10,
					})}
        </div>
        <div class="flex flex-col gap-1.5">
          <span
            class="text-xs font-medium text-(--muted) tracking-[0.06em] uppercase invisible"
            aria-hidden="true"
            >Go</span
          >
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 bg-(--text) text-(--bg) border-none rounded-(--r) px-4 py-2.25 font-semibold text-sm h-10 whitespace-nowrap transition-[background,transform] duration-150 hover:bg-[#d0d0e0] active:scale-[0.97] disabled:opacity-[0.45] disabled:cursor-not-allowed disabled:transform-none"
            id="search-btn"
          >
            ${Icons.search()}
            Search
          </button>
        </div>
      </div>

      <button
        type="button"
        class="group inline-flex items-center gap-1.25 bg-transparent border border-(--border) rounded-(--r-sm) px-3 py-1.5 text-(--text-2) text-xs font-medium mt-3.5 transition-all duration-150 hover:border-(--border-h) hover:text-(--text) hover:bg-(--surface-2) aria-expanded:text-(--accent) aria-expanded:border-[rgba(99,102,241,0.4)] aria-expanded:bg-(--accent-dim)"
        id="adv-toggle"
        aria-expanded="false"
      >
        ${Icons.chevron(12, "transition-transform duration-200 group-aria-expanded:rotate-180")}
        Advanced filters
        <span
          class="bg-(--accent) text-white rounded-full px-1.5 py-px text-xs font-semibold"
          style="display:none"
          id="adv-cnt"
        ></span>
      </button>

      <div
        class="overflow-hidden max-h-0 opacity-0 transition-[max-height,opacity] ease-in-out duration-300 [&.open]:max-h-150 [&.open]:opacity-100"
        id="adv-panel"
      ></div>
    </div>`,
  );

  container.appendChild(
    html`<div
      class="flex flex-wrap gap-1.5 mb-3.5"
      style="display:none"
      id="chips-row"
    ></div>`,
  );
}
