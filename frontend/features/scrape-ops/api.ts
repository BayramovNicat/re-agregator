import type { ScrapeRun } from "./types";

let csrfToken = "";

type ScrapeAdminSession = {
	authenticated?: boolean;
	csrfToken?: string;
	error?: string;
};

export async function fetchScrapeRuns(limit = 20): Promise<ScrapeRun[]> {
	const res = await fetch(
		`/api/scrape/runs?limit=${encodeURIComponent(limit)}`,
	);
	const data = (await res.json()) as { runs?: ScrapeRun[]; error?: string };
	if (!res.ok) throw new Error(data.error ?? "Failed to load scrape runs");
	return data.runs ?? [];
}

export async function fetchScrapeAdminSession(): Promise<boolean> {
	const res = await fetch("/api/scrape/session", { credentials: "same-origin" });
	const data = (await res.json()) as ScrapeAdminSession;
	if (!res.ok) {
		csrfToken = "";
		return false;
	}
	csrfToken = data.authenticated ? (data.csrfToken ?? "") : "";
	return Boolean(csrfToken);
}

export async function loginScrapeAdmin(password: string): Promise<void> {
	const res = await fetch("/api/scrape/login", {
		method: "POST",
		credentials: "same-origin",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ password }),
	});
	const data = (await res.json()) as ScrapeAdminSession;
	if (!res.ok) {
		csrfToken = "";
		throw new Error(data.error ?? "Unauthorized");
	}
	csrfToken = data.csrfToken ?? "";
}

export async function logoutScrapeAdmin(): Promise<void> {
	const res = await fetch("/api/scrape/logout", {
		method: "POST",
		credentials: "same-origin",
	});
	csrfToken = "";
	if (!res.ok) {
		const data = (await res.json()) as { error?: string };
		throw new Error(data.error ?? "Failed to logout");
	}
}

export async function runScrapeNow(): Promise<void> {
	const res = await fetch("/api/scrape/run", {
		method: "POST",
		credentials: "same-origin",
		headers: csrfToken ? { "x-scrape-csrf-token": csrfToken } : undefined,
	});
	const data = (await res.json()) as { error?: string };
	if (!res.ok) {
		if (res.status === 401 || res.status === 403) csrfToken = "";
		throw new Error(data.error ?? "Failed to start scrape");
	}
}

export function hasScrapeAdminSession(): boolean {
	return Boolean(csrfToken);
}
