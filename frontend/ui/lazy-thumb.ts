import { cn, html } from "../core/utils.ts";

// ─── URL ─────────────────────────────────────────────────────────────────────

function toThumbUrl(src: string): string {
	return src.replace("/uploads/full/", "/uploads/f460x345/");
}

// ─── Concurrency queue ────────────────────────────────────────────────────────

/** Maximum simultaneous image requests — mirrors HTTP/1.1 per-origin connection limit. */
const MAX_CONCURRENT = 6;

let active = 0;
const queue = new Set<HTMLImageElement>();

function startLoad(img: HTMLImageElement, src: string): void {
	active++;
	img.dataset.loading = "1";
	img.src = src;
}

/**
 * Called after every load/error settlement.
 *
 * Decrements the active counter and promotes the next eligible queued image.
 * Stale entries (disconnected from DOM) are silently discarded; iteration stops
 * as soon as one valid candidate is found and dispatched.
 */
function drainQueue(): void {
	active = Math.max(0, active - 1);
	for (const img of queue) {
		queue.delete(img);
		const src = img.dataset.src;
		if (src && !img.dataset.loaded && img.isConnected) {
			startLoad(img, src);
			return;
		}
	}
}

/**
 * Schedules an image for loading.
 *
 * If a slot is free the load starts immediately; otherwise the image is held in
 * the queue until a slot opens via {@link drainQueue}. Already-loading and
 * already-loaded images are ignored.
 */
function enqueue(img: HTMLImageElement): void {
	const src = img.dataset.src;
	if (!src || img.dataset.loaded || img.dataset.loading) return;
	if (active < MAX_CONCURRENT) {
		startLoad(img, src);
	} else {
		queue.add(img);
	}
}

// ─── Intersection observer ────────────────────────────────────────────────────

/**
 * Shared singleton observer for all {@link LazyThumb} instances.
 *
 * The `100px` top/bottom root margin pre-fetches images just before they scroll
 * into view. Images that leave the expanded viewport are removed from the
 * pending queue; in-flight requests are never aborted to avoid TCP connection
 * exhaustion on HTTP/1.1 origins.
 */
const observer = new IntersectionObserver(
	(entries) => {
		for (const entry of entries) {
			const img = entry.target as HTMLImageElement;
			if (entry.isIntersecting) {
				enqueue(img);
			} else {
				queue.delete(img);
			}
		}
	},
	{ rootMargin: "100px 0px" },
);

// ─── Types ────────────────────────────────────────────────────────────────────

/** Props accepted by {@link LazyThumb}. */
export type LazyThumbProps = Pick<HTMLImageElement, "src"> &
	Partial<HTMLImageElement>;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Viewport-aware lazy-loading thumbnail.
 *
 * Returns a bare `<img>` element — no wrapper — that starts transparent and
 * fades in once the image has decoded. Loading is deferred until the element
 * enters the viewport (+ 100 px margin) and capped at {@link MAX_CONCURRENT}
 * concurrent requests to respect the browser's HTTP/1.1 connection pool.
 *
 * @example
 * ```ts
 * const thumb = LazyThumb({ src: deal.images[0], className: "w-full h-48 rounded", alt: "Property photo" });
 * card.prepend(thumb);
 * ```
 */
export function LazyThumb({
	src,
	className = "",
	...rest
}: LazyThumbProps): HTMLImageElement {
	const img = html`
		<img
			alt=""
			referrerpolicy="no-referrer"
			class="${cn("object-cover opacity-0 transition-opacity duration-400", className)}"
		/>
	` as HTMLImageElement;

	img.dataset.src = toThumbUrl(src);
	Object.assign(img, rest);

	img.addEventListener(
		"load",
		() => {
			img.dataset.loaded = "1";
			img.classList.replace("opacity-0", "opacity-100");
			observer.unobserve(img);
			drainQueue();
		},
		{ once: true },
	);

	img.addEventListener(
		"error",
		() => {
			img.style.display = "none";
			observer.unobserve(img);
			drainQueue();
		},
		{ once: true },
	);

	observer.observe(img);

	return img;
}
