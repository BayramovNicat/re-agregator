let running = false;

/** Acquire the global scrape lock. Returns false if already locked. */
export function acquireLock(): boolean {
	if (running) return false;
	running = true;
	return true;
}

/** Release the global scrape lock. */
export function releaseLock(): void {
	running = false;
}
