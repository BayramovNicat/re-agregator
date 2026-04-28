import { ce, cn, html } from "@/core/utils";

const CONTAINER_CLS = `
  flex items-center h-10 px-3.5 
  bg-(--surface-2) border border-(--border) rounded-(--r) 
  transition-[border-color,box-shadow] duration-150 
  hover:border-(--border-h) 
  focus-within:border-(--accent) 
  focus-within:shadow-[0_0_0_3px_var(--accent-dim)]
`;

const INPUT_CLS = `
  appearance-none w-full h-1.25 rounded-full outline-none cursor-pointer m-0 
  bg-[linear-gradient(to_right,var(--accent)_var(--p,0%),var(--muted)_var(--p,0%))] 
  [&::-webkit-slider-thumb]:appearance-none 
  [&::-webkit-slider-thumb]:w-4.5 
  [&::-webkit-slider-thumb]:h-4.5 
  [&::-webkit-slider-thumb]:bg-(--bg) 
  [&::-webkit-slider-thumb]:rounded-full 
  [&::-webkit-slider-thumb]:border-2 
  [&::-webkit-slider-thumb]:border-(--accent) 
  [&::-webkit-slider-thumb]:shadow-[0_2px_5px_rgba(0,0,0,0.2)] 
  [&::-webkit-slider-thumb]:cursor-pointer 
  [&::-webkit-slider-thumb]:transition-[transform_0.1s,background_0.15s] 
  [&::-webkit-slider-thumb:hover]:scale-[1.15] 
  [&::-webkit-slider-thumb:hover]:bg-(--surface-2)
`;

/**
 * Updates the CSS variable --p on a range input to reflect its current progress.
 * This is used for the custom track background gradient.
 */
export function setRangeProgress(input: HTMLInputElement): void {
	const min = Number(input.min) || 0;
	const max = Number(input.max) || 100;
	const val = Number(input.value);
	const p = ((val - min) / (max - min)) * 100;
	input.style.setProperty("--p", `${p}%`);
}

/** Props accepted by {@link RawRange}. */
export type RawRangeProps = Omit<
	Partial<HTMLInputElement>,
	"min" | "max" | "value"
> & {
	min?: string | number;
	max?: string | number;
	value?: string | number;
};

/**
 * A basic range input component that forwards all properties to the underlying `<input type="range">`.
 */
export function RawRange(props: RawRangeProps): HTMLInputElement {
	const { min, max, value, className = "", ...rest } = props;
	const el = html`<input
		type="range"
		class="${cn(INPUT_CLS, className)}"
	/>` as HTMLInputElement;

	if (min != null) el.min = String(min);
	if (max != null) el.max = String(max);
	if (value != null) el.value = String(value);

	return ce<HTMLInputElement>(el, rest);
}

/** Props accepted by {@link Range}. */
export type RangeProps = {
	className?: string;
} & RawRangeProps;

export interface RangeElement extends HTMLDivElement {
	inputElement: HTMLInputElement;
}

/**
 * A stylized range input component with standardized branding.
 *
 * Renders a stylized `<input type="range">` wrapped in a container that provides
 * standardized typographic and surface tokens.
 * Supports full property forwarding to the underlying {@link HTMLInputElement},
 * allowing for standard attributes like `id`, `min`, `max`, and event listeners to be passed directly.
 *
 * @example
 * ```ts
 * const range = Range({ id: "price", min: 0, max: 1000, value: 500, oninput: (e) => console.log(e.target.value) });
 * container.appendChild(range);
 * ```
 */
export function Range({ className = "", ...props }: RangeProps): RangeElement {
	const input = RawRange(props);

	// Initialize progress
	setRangeProgress(input);

	// Automatically update progress on input
	input.addEventListener("input", () => setRangeProgress(input));

	const el = ce<RangeElement>(
		html` <div class="${cn(CONTAINER_CLS, className)}">${input}</div> `,
		{},
	);
	el.inputElement = input;
	return el;
}
