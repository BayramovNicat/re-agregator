import { expect, test } from "@playwright/test";
import { mockApi } from "./fixtures";

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "serviceWorker", {
			configurable: true,
			value: {
				register: (url: string) => {
					window.localStorage.setItem("sw-registered-url", url);
					return Promise.resolve({ scope: location.origin });
				},
			},
		});
	});
	await mockApi(page);
	await page.goto("/");
	await expect(page.locator(".product-card")).toHaveCount(1);
});

test("loads homepage and shows first result", async ({ page }) => {
	await expect(page.getByText("Redeal")).toBeVisible();
	await expect(page.locator(".product-card")).toHaveCount(1);
	await expect(page.getByText("₼ 120,000")).toBeVisible();
	await expect(page.locator(".product-card").getByText("High Value Deal")).toBeVisible();
});

test("health status shows property count", async ({ page }) => {
	await expect(page.getByText("1 listing")).toBeVisible();
});

test("registers service worker on load", async ({ page }) => {
	await expect
		.poll(() => page.evaluate(() => localStorage.getItem("sw-registered-url")))
		.toBe("/sw.js");
});

test("failed health check shows offline status", async ({ page }) => {
	await page.unroute("**/health");
	await page.route("**/health", async (route) => {
		await route.abort();
	});
	await page.reload();

	await expect(page.getByText("Down")).toBeVisible();
});

test("broken card thumbnail hides without breaking listing", async ({ page }) => {
	await page.route("https://example.com/image-1.jpg*", async (route) => {
		await route.abort();
	});
	await page.reload();
	const image = page.locator('.product-card img[alt=""]').first();

	await expect(page.locator(".product-card")).toHaveCount(1);
	await expect(image).toBeHidden();
	await expect(page.locator(".product-card").getByText("High Value Deal")).toBeVisible();
});

test("grid and list view switch", async ({ page }) => {
	await page.getByRole("button", { name: /list view/i }).click();
	await expect(page.locator(".product-card")).toHaveCount(1);
	await expect(page.getByText("View ↗")).toBeVisible();

	await page.getByRole("button", { name: /grid view/i }).click();
	await expect(page.getByText("View listing")).toBeVisible();
});

test("language switcher persists selected language", async ({ page }) => {
	await page.getByRole("button", { name: /en/i }).click();
	await page.getByRole("button", { name: "AZ" }).click();
	await expect(page.locator(".product-card")).toHaveCount(1);

	expect(await page.evaluate(() => localStorage.getItem("redeal-lang"))).toBe("az");
	await expect(page.getByRole("button", { name: "AZ", exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: /ətraflı filtrlər/i })).toBeVisible();
});

