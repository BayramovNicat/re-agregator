import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
	testDir: "tests/e2e",
	testMatch: "**/*.pw.ts",
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	reporter: "list",
	use: {
		baseURL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		serviceWorkers: "block",
		...devices["Desktop Chrome"],
	},
	webServer: {
		command: "bun run dev",
		url: baseURL,
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
