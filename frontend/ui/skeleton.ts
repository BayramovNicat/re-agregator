import { html } from "../core/utils";

export function SkeletonList(count: number, view: "grid" | "row"): HTMLElement {
	const wrap = document.createElement("div");
	wrap.className =
		view === "grid"
			? "grid grid-cols-5 gap-3.5 max-[1600px]:grid-cols-4 max-[1250px]:grid-cols-3 max-[850px]:grid-cols-2 max-[580px]:grid-cols-1"
			: "flex flex-col gap-2";
	const card = view === "grid" ? gridCard : rowCard;
	for (let i = 0; i < count; i++) wrap.appendChild(card());
	return wrap;
}

function gridCard(): HTMLElement {
	return html`
		<article
			class="re-skeleton bg-(--surface) border border-(--border) rounded-(--r-lg) p-4 flex flex-col gap-3.5 animate-pulse"
		>
			<div class="rounded-(--r) -mx-4 -mt-4 mb-0.5 h-40 bg-(--surface-3)"></div>
			<div class="flex justify-between items-start gap-2">
				<div class="flex flex-col gap-1.5">
					<div class="h-2.5 w-20 rounded bg-(--surface-3)"></div>
					<div class="h-6 w-28 rounded bg-(--surface-3)"></div>
				</div>
				<div class="h-5 w-16 rounded-full bg-(--surface-3)"></div>
			</div>
			<div>
				<div class="flex justify-between mb-1.75">
					<div class="h-2.5 w-32 rounded bg-(--surface-3)"></div>
					<div class="h-4 w-10 rounded bg-(--surface-3)"></div>
				</div>
				<div class="h-2 bg-(--surface-3) rounded-full"></div>
			</div>
			<div class="grid grid-cols-4 gap-1.5">
				<div class="h-12 rounded-(--r-sm) bg-(--surface-3)"></div>
				<div class="h-12 rounded-(--r-sm) bg-(--surface-3)"></div>
				<div class="h-12 rounded-(--r-sm) bg-(--surface-3)"></div>
				<div class="h-12 rounded-(--r-sm) bg-(--surface-3)"></div>
			</div>
		</article>
	`;
}

function rowCard(): HTMLElement {
	return html`
		<div
			class="re-skeleton bg-(--surface) border border-(--border) rounded-(--r) px-4 py-3 flex items-center gap-3.5 animate-pulse"
		>
			<div class="h-10 w-10 rounded-(--r-sm) bg-(--surface-3) shrink-0"></div>
			<div class="w-16 shrink-0 flex flex-col gap-1.5">
				<div class="h-4 w-10 rounded bg-(--surface-3)"></div>
				<div class="h-2.5 w-12 rounded bg-(--surface-3)"></div>
			</div>
			<div class="flex-1 flex flex-col gap-1.5">
				<div class="h-3.5 w-40 rounded bg-(--surface-3)"></div>
				<div class="h-2.5 w-56 rounded bg-(--surface-3)"></div>
			</div>
			<div class="flex gap-1 shrink-0">
				<div class="h-8 w-8 rounded-(--r-sm) bg-(--surface-3)"></div>
				<div class="h-8 w-8 rounded-(--r-sm) bg-(--surface-3)"></div>
			</div>
			<div class="h-3 w-14 rounded bg-(--surface-3) shrink-0"></div>
		</div>
	`;
}
