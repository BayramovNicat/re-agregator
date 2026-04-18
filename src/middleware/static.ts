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
			Bun.file(`${publicDir}/app.js`).arrayBuffer(),
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
		{ file: "app.js", mime: "application/javascript; charset=utf-8" },
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
		.replace('src="/app.js"', `src="/app.js?v=${version}"`);
	if (!IS_DEV) cachedVersionedHtml = html;
	return html;
}

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
				"Cache-Control": "public, max-age=31536000, immutable",
				Vary: "Accept-Encoding",
				"Content-Security-Policy": CSP,
			},
		});
	}

	const file = Bun.file(`${publicDir}${pathname}`);
	if (await file.exists()) {
		return new Response(file, {
			headers: {
				"Content-Security-Policy": CSP,
				...(IS_DEV ? { "Cache-Control": "no-store" } : {}),
			},
		});
	}

	return new Response(await getVersionedHtml(publicDir), {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-store",
			"Content-Security-Policy": CSP,
		},
	});
}
