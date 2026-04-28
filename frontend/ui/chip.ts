import { ce, cn, html } from "@/core/utils";
import { RawButton } from "./button";
import { Icons } from "./icons";

const CHIP_SHARED = cn(
	"inline-flex items-center gap-1.5",
	"px-3 py-1.25 rounded-full",
	"border border-(--border)",
	"text-(--text-2) text-xs font-medium",
	"transition-all duration-150",
	"group-hover:border-(--border-h) group-hover:text-(--text)",
	"peer-checked:border-[rgba(99,102,241,0.5)]",
	"peer-checked:text-(--accent) peer-checked:bg-(--accent-dim)",
	"before:content-[''] before:w-1.25 before:h-1.25 before:rounded-full before:bg-(--muted)",
	"before:transition-[background] before:duration-150",
	"peer-checked:before:bg-(--accent)",
);

const TAG_SHARED = cn(
	"inline-flex items-center gap-1",
	"text-[11px] font-medium px-2 py-0.75",
	"rounded-full border border-current",
	"whitespace-nowrap",
);

const CLOSEABLE_SHARED = cn(
	"inline-flex items-center gap-1",
	"bg-(--surface) border border-(--border) rounded-full",
	"pt-0.75 pb-0.75 pr-1.5 pl-2.5",
	"text-[11px] text-(--text-2)",
);

const CLOSEABLE_BTN_SHARED = cn(
	"bg-none border-none text-(--muted)",
	"flex items-center transition-[color] duration-100 px-0.5",
	"hover:text-(--text) cursor-pointer",
);

/** Props accepted by {@link Chip}. */
export type ChipProps = {
	label: string;
} & Partial<HTMLInputElement>;

export interface ChipElement extends HTMLLabelElement {
	inputElement: HTMLInputElement;
}

/**
 * An interactive filter pill with a checkbox state.
 *
 * Renders a stylized checkbox wrapped in a label.
 * Properties are forwarded to the underlying {@link HTMLInputElement}.
 */
export function Chip({
	label,
	className = "",
	...props
}: ChipProps): ChipElement {
	const input = ce<HTMLInputElement>(
		html`<input type="checkbox" class="peer absolute opacity-0 w-0 h-0" />`,
		props,
	);
	const el = html`
		<label
			class="${cn("group inline-flex cursor-pointer select-none", className)}"
		>
			${input}
			<span class="${cn(CHIP_SHARED, className)}">${label}</span>
		</label>
	` as ChipElement;
	el.inputElement = input;
	return el;
}

/** Props accepted by {@link Tag}. */
export type TagProps = {
	label: string;
	icon?: string;
} & Partial<HTMLSpanElement>;

/**
 * A static display tag (used on cards).
 */
export function Tag({
	label,
	icon,
	className = "",
	...props
}: TagProps): HTMLSpanElement {
	return ce<HTMLSpanElement>(
		html`
			<span class="${cn(TAG_SHARED, className)}">
				${icon ? `${icon} ` : ""}${label}
			</span>
		`,
		props,
	);
}

/** Props accepted by {@link CloseableChip}. */
export type CloseableChipProps = {
	label: string;
	onClose: () => void;
} & Partial<HTMLSpanElement>;

/**
 * A removable chip with a close button.
 */
export function CloseableChip({
	label,
	onClose,
	className = "",
	...props
}: CloseableChipProps): HTMLSpanElement {
	return ce<HTMLSpanElement>(
		html`
			<span class="${cn(CLOSEABLE_SHARED, className)}">
				${label}
				${RawButton({
					ariaLabel: "Remove filter",
					className: CLOSEABLE_BTN_SHARED,
					onclick: onClose,
					content: Icons.close(10),
				})}
			</span>
		`,
		props,
	);
}
