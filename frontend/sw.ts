/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = "re-finder-v1";
const ASSETS_TO_CACHE = [
	"/",
	"/index.html",
	"/main.js",
	"/styles.css",
	"/manifest.json",
	"/icons/icon-192.png",
	"/icons/icon-512.png",
];

sw.addEventListener("install", (event: ExtendableEvent) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(ASSETS_TO_CACHE);
		}),
	);
	sw.skipWaiting();
});

sw.addEventListener("activate", (event: ExtendableEvent) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME)
					.map((name) => caches.delete(name)),
			);
		}),
	);
	sw.clients.claim();
});

sw.addEventListener("fetch", (event: FetchEvent) => {
	// Only handle GET requests
	if (event.request.method !== "GET") return;

	const { request } = event;
	const isNavigation = request.mode === "navigate";

	// Stale-While-Revalidate for app assets
	event.respondWith(
		caches.match(request).then((cachedResponse) => {
			const fetchPromise = fetch(request)
				.then((networkResponse) => {
					// Cache the new response if it's valid (status 200-299)
					if (networkResponse?.ok) {
						const responseClone = networkResponse.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(request, responseClone);
						});
					}
					return networkResponse;
				})
				.catch(() => {
					// Fallback strategy:
					// 1. Use the specific cached response if available
					if (cachedResponse) return cachedResponse;

					// 2. If it's a navigation (page load), return the cached app shell (SPA)
					if (isNavigation) {
						return caches.match("/index.html").then((shell) => {
							return (
								shell ||
								new Response("Offline: App shell not found", {
									status: 503,
									headers: { "Content-Type": "text/plain" },
								})
							);
						});
					}

					// 3. Final fallback for other assets (images, APIs, etc.)
					return new Response("Network error occurred", {
						status: 408, // Request Timeout
						headers: { "Content-Type": "text/plain" },
					});
				});

			// Return the cached response immediately if available, otherwise wait for network
			return cachedResponse || fetchPromise;
		}),
	);
});
