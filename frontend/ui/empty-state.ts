import { ce, cn, html } from "../core/utils";

export type EmptyStateProps = {
	icon: SVGSVGElement;
	title: string;
	subtitle?: string;
	hidden?: boolean;
	padTop?: boolean;
} & Partial<HTMLElement>;

/**
 * Centered state view used for loading, empty, and welcome screens.
 */
export function EmptyState({
	icon,
	title,
	subtitle,
	hidden = true,
	padTop = false,
	className = "",
	...props
}: EmptyStateProps): HTMLElement {
	return ce(
		html`
			<div class="${cn(hidden && "hidden", className)}">
				<div
					class="${cn(
						"flex flex-col items-center justify-center py-20 px-5 gap-2.5 text-center",
						padTop && "pt-25",
					)}"
				>
					${icon}
					<p class="text-base font-medium text-(--text-2)">${title}</p>
					${subtitle
						? html`<p class="text-sm text-(--muted) max-w-75 leading-[1.6]">
								${subtitle}
							</p>`
						: ""}
				</div>
			</div>
		`,
		props,
	);
}
