import { watch } from "node:fs";
import { dirs, skippedWatchExtensions } from "./config";

export function watchFrontend(build: () => Promise<void>) {
	let timer: ReturnType<typeof setTimeout> | null = null;

	watch(dirs.frontend, { recursive: true }, (_event, filename) => {
		if (!filename) return;
		const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
		if (skippedWatchExtensions.has(ext)) return;
		if (timer) clearTimeout(timer);
		timer = setTimeout(async () => {
			process.stdout.write(`[watch] ${filename} → rebuilding...\n`);
			await build();
		}, 80);
	});

	console.log("Watching frontend/ for changes...");
}
