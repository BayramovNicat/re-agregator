import { brotliCompressSync } from "node:zlib";
import { CSP, IS_DEV } from "@/config.js";

const brAssets = new Map<string, { data: Buffer; contentType: string }>();
let cachedVersionedHtml: string | null = null;
let assetVersion = "dev";

export async function initStatic(publicDir: string): Promise<void> {
	assetVersion = await computeAssetHash(publicDir);
	if (!IS_DEV) {
		await precompressStatic(publicDir);
		console.log(`Brotli pre-compressed: ${[...brAssets.keys()].join(", ")}`);
	}
	console.log(`Asset version: ${assetVersion}`);
}

async function computeAssetHash(publicDir: string): Promise<string> {
	try {
		const [js, css] = await Promise.all([
			Bun.file(`${publicDir}/main.js`).arrayBuffer(),
			Bun.file(`${publicDir}/styles.css`).arrayBuffer(),
		]);
		const hasher = new Bun.CryptoHasher("md5");
		hasher.update(js);
		hasher.update(css);
		return hasher.digest("hex").slice(0, 8);
	} catch {
		return "dev";
	}
}

async function precompressStatic(dir: string): Promise<void> {
	const entries: Array<{ file: string; mime: string }> = [
		{ file: "main.js", mime: "application/javascript; charset=utf-8" },
		{ file: "styles.css", mime: "text/css; charset=utf-8" },
	];
	await Promise.all(
		entries.map(async ({ file, mime }) => {
			const f = Bun.file(`${dir}/${file}`);
			if (!(await f.exists())) return;
			const compressed = brotliCompressSync(Buffer.from(await f.arrayBuffer()));
			brAssets.set(`/${file}`, { data: compressed, contentType: mime });
		}),
	);
}

async function getVersionedHtml(publicDir: string): Promise<string> {
	if (!IS_DEV && cachedVersionedHtml !== null) return cachedVersionedHtml;
	const raw = await Bun.file(`${publicDir}/index.html`).text();
	const version = IS_DEV ? Date.now().toString() : assetVersion;
	const html = raw
		.replace('href="/styles.css"', `href="/styles.css?v=${version}"`)
		.replace('src="/main.js"', `src="/main.js?v=${version}"`);
	if (!IS_DEV) cachedVersionedHtml = html;
	return html;
}

const IMMUTABLE_EXTS = new Set([
	".js",
	".css",
	".png",
	".jpg",
	".jpeg",
	".webp",
	".svg",
	".ico",
	".woff2",
	".woff",
	".ttf",
	".webmanifest",
	".json",
]);

const CACHE_IMMUTABLE = "public, max-age=31536000, immutable";
const CACHE_REVALIDATE = "no-cache";

export async function serveStatic(
	req: Request,
	publicDir: string,
): Promise<Response> {
	const url = new URL(req.url);
	const pathname = url.pathname;
	const acceptsBr = (req.headers.get("Accept-Encoding") ?? "").includes("br");

	const asset = brAssets.get(pathname);
	if (!IS_DEV && acceptsBr && asset) {
		return new Response(asset.data, {
			headers: {
				"Content-Type": asset.contentType,
				"Content-Encoding": "br",
				"Cache-Control": CACHE_IMMUTABLE,
				Vary: "Accept-Encoding",
				"Content-Security-Policy": CSP,
			},
		});
	}

	const file = Bun.file(`${publicDir}${pathname}`);
	if (await file.exists()) {
		const headers: Record<string, string> = {
			"Content-Security-Policy": CSP,
		};

		if (IS_DEV) {
			headers["Cache-Control"] = "no-store";
		} else if (pathname === "/sw.js") {
			headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
		} else {
			const dotIndex = pathname.lastIndexOf(".");
			if (dotIndex !== -1) {
				const ext = pathname.slice(dotIndex).toLowerCase();
				if (IMMUTABLE_EXTS.has(ext)) {
					headers["Cache-Control"] = CACHE_IMMUTABLE;
				}
			}
		}

		return new Response(file, { headers });
	}

	return new Response(await getVersionedHtml(publicDir), {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": CACHE_REVALIDATE,
			"Content-Security-Policy": CSP,
		},
	});
}

