import { html } from "../core/utils";

export function StatBox({
	label,
	value,
}: {
	label: string;
	value: string | number;
}): HTMLElement {
	return html`
		<div class="bg-(--surface-2) rounded-(--r-sm) py-2 px-1.5 text-center">
			<div class="text-xs text-(--muted) mb-0.75">${label}</div>
			<div class="text-xs font-semibold">${value}</div>
		</div>
	`;
}
