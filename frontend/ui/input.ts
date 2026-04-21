import { cn, html } from "../core/utils.ts";

const SHARED_CLS = `
	bg-(--surface-2) border border-(--border) rounded-(--r-sm)
	font-inherit text-(--text)
	transition-all duration-150
	placeholder:text-(--muted)
	focus:outline-none focus:border-(--accent)
	focus:shadow-[0_0_0_3px_var(--accent-dim)]
	box-border
`;

const VARIANTS = {
	sm: "px-2.5 py-1.75 text-sm",
	xs: "px-2.5 py-1.5 text-xs hover:border-(--border-h)",
};

export type InputProps = {
	variant?: keyof typeof VARIANTS;
} & Partial<HTMLInputElement>;

/**
 * A stylized text input with standardized branding.
 *
 * Renders a stylized `<input>` using standardized typographic and surface tokens.
 * Supports full property forwarding to the underlying {@link HTMLInputElement},
 * allowing for standard attributes like `type`, `placeholder`, and `value` to be passed directly.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input MDN <input> element}
 *
 * @example
 * ```ts
 * const input = Input({ type: "number", placeholder: "0.00", variant: "sm" });
 * container.appendChild(input);
 * ```
 */
export function Input({
	variant = "sm",
	className = "",
	...rest
}: InputProps): HTMLInputElement {
	const el = html`
		<input class="${cn(SHARED_CLS, VARIANTS[variant], className)}" />
	` as HTMLInputElement;

	Object.assign(el, rest);

	return el;
}
