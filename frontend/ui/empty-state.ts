import { html } from "../core/utils";

/**
 * Centered state view used for loading, empty, and welcome screens.
 */
export function EmptyState({
	id,
	icon,
	title,
	subtitle,
	hidden = true,
	padTop = false,
}: {
	id?: string;
	icon: SVGSVGElement;
	title: string;
	subtitle?: string;
	hidden?: boolean;
	padTop?: boolean;
}): HTMLElement {
	const el = html`
		<div class="${hidden ? "hidden" : ""}">
			<div
				class="flex flex-col items-center justify-center py-20 px-5 gap-2.5 text-center ${
					padTop ? "pt-25" : ""
				}"
			>
				${icon}
				<p class="text-base font-medium text-(--text-2)">${title}</p>
				${
					subtitle
						? html`<p class="text-sm text-(--muted) max-w-75 leading-[1.6]">
							${subtitle}
						</p>`
						: ""
				}
			</div>
		</div>
	`;
	if (id) el.id = id;
	return el;
}
