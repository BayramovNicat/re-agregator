import { ce, cn, html } from "../core/utils.ts";
import { Label } from "./label";

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

/** Props accepted by {@link RawInput}. */
export type RawInputProps = Partial<HTMLInputElement>;

/**
 * A basic input component that forwards all properties to the underlying `<input>`.
 */
export function RawInput(props: RawInputProps): HTMLInputElement {
	return ce(html`<input />`, props);
}

/** Props accepted by {@link Input}. */
export type InputProps = {
	variant?: keyof typeof VARIANTS;
} & RawInputProps;

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
	...props
}: InputProps) {
	return RawInput({
		className: cn(SHARED_CLS, VARIANTS[variant], className),
		...props,
	});
}

/** Props accepted by {@link Field}. */
export type FieldProps = {
	htmlFor: string;
	label: string;
	input: HTMLElement;
} & Partial<HTMLDivElement>;

/**
 * A layout wrapper for form fields that stacks a label above an input or select element.
 *
 * Renders a `<div>` with standardized spacing and property forwarding.
 *
 * @example
 * ```ts
 * const field = Field({
 *   htmlFor: "email",
 *   label: "Email Address",
 *   input: Input({ id: "email", type: "email" })
 * });
 * ```
 */
export function Field({
	htmlFor,
	label,
	input,
	className = "",
	...props
}: FieldProps): HTMLDivElement {
	return ce<HTMLDivElement>(
		html`
			<div class="${cn("flex flex-col gap-1.5", className)}">
				${Label({ htmlFor, text: label })} ${input}
			</div>
		`,
		props,
	);
}
