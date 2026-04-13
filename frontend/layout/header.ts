import { frag, html } from "../core/utils";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";

export function renderHeader(container: HTMLElement): void {
	container.appendChild(html`<header
    class="flex items-center justify-between pt-6 pb-5 border-b border-(--border) mb-6"
  >
    <div class="flex items-center gap-2.5">
      <div
        class="w-8.5 h-8.5 rounded-(--r-sm) bg-(--accent-dim) border border-[rgba(99,102,241,0.35)] flex items-center justify-center text-(--accent) shrink-0"
      >
        ${Icons.home()}
      </div>
      <div>
        <div class="text-base font-bold tracking-[-0.3px]">RE Finder</div>
        <div class="text-xs text-(--muted) mt-px">
          Baku undervalued property scanner
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      ${Button({
				id: "heatmap-btn",
				title: "Price heatmap by district",
				color: "indigo",
				content: frag`${Icons.globe()} Price Map`,
			})}
      <div
        class="inline-flex items-center gap-1.5 bg-(--surface) border border-(--border) rounded-full py-1.25 pr-3 pl-2 text-xs text-(--text-2)"
        id="health-chip"
      >
        <div
          class="w-1.5 h-1.5 rounded-full bg-(--green) animate-[livepulse_2s_ease-in-out_infinite]"
        ></div>
        <span id="health-txt">Live</span>
      </div>
    </div>
  </header>`);
}
