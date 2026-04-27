import { bus, EVENTS } from "../core/events";
import { html } from "../core/utils";
import { Dialog } from "../ui/dialog";
import { Gallery } from "../ui/gallery";

/**
 * Gallery feature controller.
 * Manages the full-screen photo viewer and handles focus restoration.
 */
export function initGallery(root: HTMLElement): () => void {
	const gallery = Gallery({ fullscreen: true });

	// Use Dialog with overrides for a seamless full-screen experience
	const modal = Dialog({
		maxWidth: "none",
		showClose: true,
		className:
			"fixed inset-0 translate-x-0 translate-y-0 w-screen h-screen max-w-none max-h-none rounded-none border-none shadow-none bg-black/95",
		content: html`<div class="flex-1 flex flex-col min-h-0">${gallery}</div>`,
	});

	let lastTrigger: HTMLElement | null = null;

	function open(data: { urls: string[]; index?: number }): void {
		lastTrigger = document.activeElement as HTMLElement;
		const { urls, index = 0 } = data;
		gallery.setUrls(urls, index);
		modal.showModal();
	}

	// ── Interaction Handlers ───────────────────────────────────────────────────

	modal.addEventListener("close", () => {
		if (lastTrigger) {
			lastTrigger.focus({ preventScroll: true });
			lastTrigger = null;
		}
	});

	modal.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.key === "ArrowLeft" || e.key === "ArrowUp") gallery.navigate(-1);
		if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ")
			gallery.navigate(1);
	});

	root.appendChild(modal);

	const offGallery = bus.on(EVENTS.GALLERY_OPEN, (data) => open(data));

	return () => {
		offGallery();
		modal.remove();
	};
}

/**
 * Convenience wrapper to trigger the gallery via the event bus.
 */
export function openGallery(urls: string[], index = 0): void {
	bus.emit(EVENTS.GALLERY_OPEN, { urls, index });
}
