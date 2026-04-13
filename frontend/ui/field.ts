import { html } from "../core/utils";
import { Label } from "./label";

/**
 * Form field wrapper: label stacked above an input/select.
 */
export function Field({
	htmlFor,
	label,
	input,
}: {
	htmlFor: string;
	label: string;
	input: HTMLElement;
}): HTMLElement {
	return html`
		<div class="flex flex-col gap-1.5">
			${Label({ htmlFor, text: label })}
			${input}
		</div>
	`;
}
