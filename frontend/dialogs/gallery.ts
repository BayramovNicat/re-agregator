import { bus, EVENTS } from "../core/events";
import { html } from "../core/utils";
import { Icons } from "../ui/icons";

/**
 * Gallery feature encapsulates its state and DOM references within initGallery.
 * It listens for bus EVENTS.GALLERY_OPEN to trigger the modal.
 */
export function initGallery(root: HTMLElement): () => void {
	let $modal: HTMLDialogElement;
	let $slider: HTMLElement;
	let $counter: HTMLElement;

	let index = 0;
	let total = 0;

	function updateGallery(): void {
		if (!$slider) return;
		const slides = Array.from($slider.children) as HTMLElement[];
		slides.forEach((slide, i) => {
			slide.style.opacity = i === index ? "1" : "0";
			slide.style.visibility = i === index ? "visible" : "hidden";
		});

		if ($counter) {
			$counter.textContent = total > 1 ? `${index + 1} / ${total}` : "";
		}
	}

	function go(dir: 1 | -1): void {
		if (total <= 1) return;
		index = (index + dir + total) % total;
		updateGallery();
	}

	function open(urls: string[]): void {
		total = urls.length;
		index = 0;
		$slider.innerHTML = "";

		for (const url of urls) {
			const slide = document.createElement("div");
			slide.className =
				"absolute inset-0 flex items-center justify-center p-4 transition-opacity duration-400 ease-in-out";
			slide.style.opacity = "0";
			slide.style.visibility = "hidden";

			const img = document.createElement("img");
			img.src = url;
			img.referrerPolicy = "no-referrer";
			img.alt = "";
			img.className =
				"max-h-full max-w-full object-contain shadow-2xl rounded-sm";

			slide.appendChild(img);
			$slider.appendChild(slide);
		}

		const showNav = total > 1;
		const prev = $modal.querySelector("#gallery-prev") as HTMLElement;
		const next = $modal.querySelector("#gallery-next") as HTMLElement;
		if (prev) prev.style.display = showNav ? "" : "none";
		if (next) next.style.display = showNav ? "" : "none";

		updateGallery();
		$modal.showModal();
	}

	// 1. Initial Render
	const modal = html`
    <dialog
      id="gallery-modal"
      class="bg-transparent border-none p-0 max-w-none max-h-none w-screen h-screen backdrop:bg-black/95 focus:outline-none"
    >
      <div class="fixed inset-0 select-none overflow-hidden">
        <div id="gallery-backdrop" class="absolute inset-0"></div>

        <div
          id="gallery-slider"
          class="relative h-full w-full pointer-events-none"
        ></div>

        <button
          id="gallery-close"
          class="absolute top-6 right-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all active:scale-95"
          aria-label="Close"
        >
          ${Icons.close(20)}
        </button>

        <button
          id="gallery-prev"
          class="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-sm transition-all active:scale-90"
          aria-label="Previous"
        >
          ${Icons.chevronLeft(24)}
        </button>

        <button
          id="gallery-next"
          class="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-sm transition-all active:scale-90"
          aria-label="Next"
        >
          ${Icons.chevronRight(24)}
        </button>

        <span
          id="gallery-counter"
          class="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 text-white/90 text-sm font-medium tabular-nums bg-black/40 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md shadow-lg"
        ></span>
      </div>
    </dialog>
  ` as HTMLDialogElement;

	$modal = modal;
	$slider = modal.querySelector("#gallery-slider") as HTMLElement;
	$counter = modal.querySelector("#gallery-counter") as HTMLElement;

	// 2. Event Listeners
	const handlers: [HTMLElement | Window, string, EventListener][] = [
		[
			modal.querySelector("#gallery-backdrop") as HTMLElement,
			"click",
			() => modal.close(),
		],
		[
			modal.querySelector("#gallery-close") as HTMLElement,
			"click",
			() => modal.close(),
		],
		[
			modal.querySelector("#gallery-prev") as HTMLElement,
			"click",
			() => go(-1),
		],
		[modal.querySelector("#gallery-next") as HTMLElement, "click", () => go(1)],
		[
			modal,
			"keydown",
			(e: Event) => {
				const key = (e as KeyboardEvent).key;
				if (key === "ArrowLeft" || key === "ArrowUp") go(-1);
				if (key === "ArrowRight" || key === "ArrowDown" || key === " ") go(1);
				if (key === "Escape") modal.close();
			},
		],
	];

	handlers.forEach(([el, ev, fn]) => {
		el.addEventListener(ev, fn);
	});

	root.appendChild(modal);

	const offGallery = bus.on(EVENTS.GALLERY_OPEN, (urls) => open(urls));

	// 3. Cleanup
	return () => {
		handlers.forEach(([el, ev, fn]) => {
			el.removeEventListener(ev, fn);
		});
		offGallery();
		modal.remove();
	};
}

/**
 * Convenience wrapper to trigger the gallery via the event bus.
 */
export function openGallery(urls: string[]): void {
	bus.emit(EVENTS.GALLERY_OPEN, urls);
}
