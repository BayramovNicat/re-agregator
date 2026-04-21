import { ce, cn, html } from "../core/utils";
import { Label } from "./label";

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
