import { promisify } from "node:util";
import { brotliCompress, constants } from "node:zlib";

const compress = promisify(brotliCompress);

type Handler = (req: Request) => Response | Promise<Response>;

export function br(handler: Handler): Handler {
	return async (req) => {
		const res = await handler(req);
		// If the client accepts br but response is already compressed, skip double compression
		if (res.headers.get('Content-Encoding')?.includes('br')) return res;
		if (!(req.headers.get("Accept-Encoding") ?? "").includes("br")) return res;
		const body = await res.arrayBuffer();
		const compressed = await compress(Buffer.from(body), {
			params: { [constants.BROTLI_PARAM_QUALITY]: 4 },
		});
		const headers = new Headers(res.headers);
		headers.set("Content-Encoding", "br");
		headers.set("Vary", "Accept-Encoding");
		headers.delete("Content-Length");
		return new Response(compressed, { status: res.status, headers });
	};
}

