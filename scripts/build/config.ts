export const watchMode = process.argv.includes("--watch");

export const dirs = {
	frontend: "./frontend",
	public: "./public",
	leaflet: "./node_modules/leaflet/dist",
} as const;

export const skippedWatchExtensions = new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".gif",
	".ico",
	".svg",
]);
