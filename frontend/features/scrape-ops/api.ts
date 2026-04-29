import type { ScrapeRun } from "./types";

const ADMIN_TOKEN_KEY = "redeal:scrape-admin-token";

export async function fetchScrapeRuns(limit = 20): Promise<ScrapeRun[]> {
	const res = await fetch(
		`/api/scrape/runs?limit=${encodeURIComponent(limit)}`,
	);
	const data = (await res.json()) as { runs?: ScrapeRun[]; error?: string };
	if (!res.ok) throw new Error(data.error ?? "Failed to load scrape runs");
	return data.runs ?? [];
}

export async function runScrapeNow(token: string): Promise<void> {
	const res = await fetch("/api/scrape/run", {
		method: "POST",
		headers: { "x-scrape-admin-token": token },
	});
	const data = (await res.json()) as { error?: string };
	if (!res.ok) {
		if (res.status === 401) localStorage.removeItem(ADMIN_TOKEN_KEY);
		throw new Error(data.error ?? "Failed to start scrape");
	}
}

export function getScrapeAdminToken(): string {
	return localStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
}

export function setScrapeAdminToken(token: string): void {
	localStorage.setItem(ADMIN_TOKEN_KEY, token);
}
