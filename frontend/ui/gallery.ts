import { t } from "../core/i18n";
import { ce, cn, html, makeEventManager, toThumbUrl } from "../core/utils";
import { RawButton } from "./button";
import { Icons } from "./icons";

/** Props accepted by {@link Gallery}. */
export type GalleryProps = {
	fullscreen?: boolean;
	onExpand?: () => void;
	onIndexChange?: (index: number) => void;
	style?: string | Partial<CSSStyleDeclaration>;
} & Omit<Partial<HTMLDivElement>, "style">;

/** Extended element returned by {@link Gallery}. */
export interface GalleryElement extends HTMLDivElement {
	setUrls: (urls: string[], initialIndex?: number) => void;
	navigate: (dir: 1 | -1) => void;
	getUrls: () => string[];
	getIndex: () => number;
	destroy: () => void;
}

/**
 * Reusable gallery component with lazy loading and preloading.
 * Standardized to follow the project's component pattern with property forwarding.
 */
export function Gallery({
	fullscreen = false,
	onExpand,
	onIndexChange,
	className = "",
	...props
}: GalleryProps): GalleryElement {
	let currentIndex = 0;
	let count = 0;
	let imageUrls: string[] = [];
	const eventManager = makeEventManager();

	// 1. Create sub-elements directly
	const sliderElm = html`<div
		class="relative w-full h-full ${fullscreen ? "pointer-events-none" : ""}"
	></div>`;

	const emptyElm = html`
		<div
			class="absolute inset-0 flex-col items-center justify-center gap-2 text-(--muted) text-sm hidden"
		>
			${Icons.gallery(24)}
			<span>${t("propNoImages")}</span>
		</div>
	`;

	const prevBtn = RawButton({
		ariaLabel: t("galleryPrev"),
		className: cn(
			"absolute top-1/2 -translate-y-1/2 z-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10 backdrop-blur-sm transition-all active:scale-90",
			fullscreen ? "left-6 w-12 h-12" : "left-3 w-9 h-9",
			"hidden",
		),
		content: Icons.chevronLeft(fullscreen ? 24 : 18),
		onclick: (e) => {
			e.stopPropagation();
			_navigate(-1);
		},
	});

	const nextBtn = RawButton({
		ariaLabel: t("galleryNext"),
		className: cn(
			"absolute top-1/2 -translate-y-1/2 z-10 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10 backdrop-blur-sm transition-all active:scale-90",
			fullscreen ? "right-6 w-12 h-12" : "right-3 w-9 h-9",
			"hidden",
		),
		content: Icons.chevronRight(fullscreen ? 24 : 18),
		onclick: (e) => {
			e.stopPropagation();
			_navigate(1);
		},
	});

	const counterElm = html`
		<span
			aria-live="polite"
			class="${cn(
				"absolute left-1/2 -translate-x-1/2 z-10 text-white/80 text-xs font-medium tabular-nums bg-black/50 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md select-none",
				fullscreen ? "bottom-10" : "bottom-3",
				"hidden",
			)}"
		></span>
	`;

	const expandBtn = onExpand
		? RawButton({
				ariaLabel: t("galleryExpand"),
				className:
					"absolute bottom-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10 backdrop-blur-sm transition-all active:scale-95",
				content: Icons.expand(14),
				onclick: (e) => {
					e.stopPropagation();
					onExpand();
				},
			})
		: null;

	// 2. Assemble the main element
	const rootElm = ce(
		html`
			<div
				class="${cn(
					"relative bg-black overflow-hidden outline-none group/gv",
					fullscreen ? "h-full w-full" : "",
					className,
				)}"
				style="${fullscreen ? "" : "height:320px"}"
				tabindex="0"
				role="region"
				aria-label="${t("gallery")}"
			>
				${sliderElm} ${emptyElm} ${prevBtn} ${nextBtn} ${counterElm} ${expandBtn || ""}
			</div>
		`,
		props,
	) as GalleryElement;

	// 3. Logic
	const _loadImage = (idx: number): void => {
		if (count === 0) return;
		const i = (idx + count) % count;
		const slide = sliderElm.children[i] as HTMLElement | undefined;
		if (!slide) return;
		const img = slide.querySelector("img");
		if (img && !img.src && imageUrls[i]) {
			img.src = fullscreen ? imageUrls[i] : toThumbUrl(imageUrls[i]);
		}
	};

	const _sync = (): void => {
		const slides = Array.from(sliderElm.children) as HTMLElement[];
		slides.forEach((s, i) => {
			s.style.opacity = i === currentIndex ? "1" : "0";
			s.style.visibility = i === currentIndex ? "visible" : "hidden";
		});

		const showNav = count > 1;
		prevBtn.classList.toggle("hidden", !showNav);
		prevBtn.classList.toggle("flex", showNav);
		nextBtn.classList.toggle("hidden", !showNav);
		nextBtn.classList.toggle("flex", showNav);
		counterElm.classList.toggle("hidden", !showNav);

		if (showNav) {
			counterElm.textContent = `${currentIndex + 1} / ${count}`;
		}

		emptyElm.classList.toggle("hidden", count > 0);
		emptyElm.classList.toggle("flex", count === 0);
		if (expandBtn) expandBtn.classList.toggle("hidden", count === 0);

		// Lazy load current + preload neighbors
		_loadImage(currentIndex);
		_loadImage(currentIndex + 1);
		_loadImage(currentIndex - 1);
	};

	const _navigate = (dir: 1 | -1): void => {
		if (count <= 1) return;
		currentIndex = (currentIndex + dir + count) % count;
		_sync();
		onIndexChange?.(currentIndex);
	};

	// Events
	let swipeStartX = 0;
	eventManager.add(rootElm, "pointerdown", (e: PointerEvent) => {
		swipeStartX = e.clientX;
	});
	eventManager.add(rootElm, "pointerup", (e: PointerEvent) => {
		const dx = e.clientX - swipeStartX;
		if (Math.abs(dx) > 40) _navigate(dx < 0 ? 1 : -1);
	});
	eventManager.add<KeyboardEvent>(rootElm, "keydown", (e) => {
		if (e.key === "ArrowLeft") {
			e.stopPropagation();
			_navigate(-1);
		} else if (e.key === "ArrowRight" || e.key === " ") {
			e.stopPropagation();
			_navigate(1);
		}
	});

	const _createSlide = (_: string, i: number): HTMLElement => {
		return html`
			<div
				class="absolute inset-0 flex items-center justify-center transition-opacity ${
					fullscreen ? "duration-400 p-4" : "duration-300"
				}"
				style="opacity: 0; visibility: hidden"
			>
				<img
					referrerPolicy="no-referrer"
					alt="${t("propPhotoAlt", { n: i + 1, total: count })}"
					draggable="false"
					class="${cn(
						"max-h-full max-w-full object-contain select-none pointer-events-none",
						fullscreen && "shadow-2xl rounded-sm",
					)}"
				/>
			</div>
		`;
	};

	return Object.assign(rootElm, {
		setUrls(newUrls: string[], initialIndex = 0) {
			imageUrls = newUrls;
			count = imageUrls.length;
			currentIndex = initialIndex;
			sliderElm.replaceChildren(...imageUrls.map(_createSlide));
			_sync();
		},
		navigate: _navigate,
		getUrls: () => imageUrls,
		getIndex: () => currentIndex,
		destroy: () => eventManager.cleanup(),
	});
}
