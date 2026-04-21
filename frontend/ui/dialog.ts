import { ce, cn, html } from "../core/utils";

const BACKDROP = `
	bg-transparent border-none p-0 
	max-w-screen max-h-screen w-full h-full 
	backdrop:bg-black/78 backdrop:backdrop-blur-sm
`;

const INNER = `
	fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
	flex flex-col overflow-hidden
	bg-(--surface) border border-(--border) rounded-(--r-lg)
	shadow-[0_24px_80px_rgba(0,0,0,0.6)]
`;

/** Props accepted by {@link Dialog}. */
export type DialogProps = {
	/** Maximum width of the dialog panel (e.g. "860px"). Responsive width is handled automatically. */
	maxWidth: string;
	content: unknown;
} & Partial<HTMLDialogElement>;

/**
 * A stylized dialog component with standardized branding and backdrop logic.
 *
 * Renders a stylized `<dialog>` using standardized typographic and surface tokens.
 * Supports full property forwarding to the underlying {@link HTMLDialogElement},
 * allowing for standard attributes like `id`, `aria-label`, and event listeners to be passed directly.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog MDN <dialog> element}
 *
 * @example
 * ```ts
 * const dialog = Dialog({
 *   maxWidth: "600px",
 *   content: html`<div>Hello World</div>`,
 *   onclick: (e) => console.log("clicked")
 * });
 * ```
 */
export function Dialog({
	maxWidth,
	content,
	className = "",
	...props
}: DialogProps): HTMLDialogElement {
	const el = ce<HTMLDialogElement>(
		html`
			<dialog class="${BACKDROP}" aria-modal="true">
				<div
					class="${cn(INNER, className)}"
					style="width:calc(100vw - 2rem);max-width:${maxWidth}"
				>
					${content}
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
