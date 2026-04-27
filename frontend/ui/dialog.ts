import { ce, cn, html } from "../core/utils";
import { Button } from "./button";
import { Icons } from "./icons";

const BACKDROP = `
	bg-transparent border-none p-0 
	max-w-screen max-h-screen w-full h-full 
	backdrop:bg-black/78 backdrop:backdrop-blur-sm
`;

const INNER = `
	fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
	flex flex-col overflow-hidden
	bg-(--surface) border border-(--border) rounded-(--r-lg)
	max-h-[calc(100vh-2rem)]
	shadow-[0_24px_80px_rgba(0,0,0,0.6)]
`;

/** Props accepted by {@link Dialog}. */
export type DialogProps = {
	/** Maximum width of the dialog panel (e.g. "860px"). Responsive width is handled automatically. */
	maxWidth: string;
	/** Optional title for the standardized header. */
	title?: string;
	/** Optional description text or element for the header. */
	description?: unknown;
	/** Whether to show a close button in the top-right. Defaults to true if title is provided. */
	showClose?: boolean;
	/** Main content of the dialog. */
	content: unknown;
} & Partial<HTMLDialogElement>;

/**
 * A stylized dialog component with standardized branding and backdrop logic.
 *
 * Renders a stylized `<dialog>` using standardized typographic and surface tokens.
 * If a `title` is provided, it automatically includes a standardized header with a close button.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog MDN <dialog> element}
 */
export function Dialog({
	maxWidth,
	title,
	description,
	showClose,
	content,
	className = "",
	...props
}: DialogProps): HTMLDialogElement {
	const displayClose = showClose ?? !!title;

	const closeBtn = displayClose
		? Button({
				content: Icons.close(18),
				variant: "ghost",
				color: "muted",
				className:
					"absolute top-5 right-5 size-8 flex items-center justify-center rounded-full hover:bg-(--surface-3) transition-colors z-10",
				onclick: (e) => {
					const d = (e.currentTarget as HTMLElement).closest(
						"dialog",
					) as HTMLDialogElement;
					d?.close();
				},
			})
		: "";

	const header = title
		? html`
				<div
					class="relative p-6 pb-4 border-b border-(--border) bg-linear-to-br from-(--surface) to-(--surface-2)"
				>
					${closeBtn}
					<div class="text-lg font-bold text-(--text) tracking-tight mb-1">
						${title}
					</div>
					${description
						? html`<p class="text-xs text-(--muted) leading-relaxed pr-8">
								${description}
							</p>`
						: ""}
				</div>
			`
		: displayClose
			? html`<div class="relative">${closeBtn}</div>`
			: "";

	const el = ce<HTMLDialogElement>(
		html`
			<dialog class="${BACKDROP}" aria-modal="true">
				<div
					class="${cn(INNER, className)}"
					style="width:calc(100vw - 2rem);max-width:${maxWidth}"
				>
					${header}
					<div class="flex-1 flex flex-col min-h-0">${content}</div>
				</div>
			</dialog>
		`,
		props,
	);

	el.addEventListener("click", (e) => {
		if (e.target === e.currentTarget) el.close();
	});

	return el;
}
