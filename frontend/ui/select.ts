import { ce, cn, html } from "@/core/utils";

const SHARED =
	"bg-(--surface-2) border border-(--border) rounded-(--r-sm) font-inherit appearance-none cursor-pointer transition-[border-color] duration-150";

const VARIANTS = {
	xs: "px-2.5 py-1.5 text-(--text-2) text-xs hover:border-(--border-h)",
	sm: "px-2.5 py-1.75 text-(--text) text-sm focus:outline-none focus:border-(--accent) focus:shadow-[0_0_0_3px_var(--accent-dim)]",
};

export interface SelectOption {
	value: string;
	label: string;
}

export type SelectProps = {
	options: SelectOption[];
	variant?: keyof typeof VARIANTS;
} & Omit<Partial<HTMLSelectElement>, "options">;

/**
 * A stylized select component with standardized branding and variations.
 * Supports full property forwarding to the underlying {@link HTMLSelectElement}.
 */
export function Select({
	options,
	variant = "sm",
	className = "",
	...props
}: SelectProps): HTMLSelectElement {
	return ce<HTMLSelectElement>(
		html`
			<select class="${cn(SHARED, VARIANTS[variant], className)}">
				${options.map(
					(o) => html`<option value="${o.value}">${o.label}</option>`,
				)}
			</select>
		`,
		props,
	);
}
