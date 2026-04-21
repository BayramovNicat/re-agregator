import { ce, cn, html } from "../core/utils.ts";

/** Props accepted by {@link Label}. */
export type LabelProps = {
	text: string;
} & Partial<HTMLLabelElement>;

/**
 * A semantically-compliant `<label>` element with standardized branding.
 *
 * Renders a stylized label using standardized typographic tokens.
 * Supports full property forwarding to the underlying {@link HTMLLabelElement},
 * allowing for standard attributes like `htmlFor` to be passed directly.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label MDN <label> element}
 *
 * @example
 * ```ts
 * const label = Label({ text: "Email Address", htmlFor: "email-input" });
 * container.appendChild(label);
 * ```
 */
export function Label({ text, className = "", ...props }: LabelProps) {
	return ce<HTMLLabelElement>(
		html`
			<label
				class="${cn(
					"text-xs font-medium text-(--muted) tracking-[0.06em] uppercase",
					className,
				)}"
			>
				${text}
			</label>
		`,
		props,
	);
}
