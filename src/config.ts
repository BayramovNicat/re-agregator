export const PORT = Number(process.env.PORT ?? 3000);
export const IS_DEV = process.env.NODE_ENV === "development";
export const SCRAPE_ADMIN_TOKEN = process.env.SCRAPE_ADMIN_TOKEN ?? "";
export const SCRAPE_ADMIN_PASSWORD =
	process.env.SCRAPE_ADMIN_PASSWORD ?? SCRAPE_ADMIN_TOKEN;
export const SCRAPE_ADMIN_SESSION_SECRET =
	process.env.SCRAPE_ADMIN_SESSION_SECRET ?? SCRAPE_ADMIN_PASSWORD;
export const SCRAPE_ADMIN_SESSION_TTL_SECONDS = Number(
	process.env.SCRAPE_ADMIN_SESSION_TTL_SECONDS ?? 8 * 60 * 60,
);
export const CSP =
	"require-trusted-types-for 'script'; trusted-types redeal default;";
