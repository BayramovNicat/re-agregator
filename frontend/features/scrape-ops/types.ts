export type ScrapeRunStatus = "running" | "success" | "failed" | "skipped";
export type ScrapeRunTrigger = "manual" | "cron";

export type ScrapeRunPlatform = {
	platform: string;
	fetched: number;
	persisted: number;
	skipped: number;
	errors: number;
};

export type ScrapeRun = {
	id: string;
	trigger: ScrapeRunTrigger;
	status: ScrapeRunStatus;
	started_at: string;
	finished_at: string | null;
	duration_ms: number | null;
	options: {
		maxPages?: number;
		startPage?: number;
		endPage?: number;
		delayMs?: number;
	} | null;
	platform_results: ScrapeRunPlatform[] | null;
	total_fetched: number;
	total_persisted: number;
	total_skipped: number;
	total_errors: number;
	error_message: string | null;
};
