import { brotliCompressSync } from "node:zlib";

type Handler = (req: Request) => Response | Promise<Response>;

export function br(handler: Handler): Handler {
	return async (req) => {
		const res = await handler(req);
		if (!(req.headers.get("Accept-Encoding") ?? "").includes("br")) return res;
		const body = await res.arrayBuffer();
		const compressed = brotliCompressSync(Buffer.from(body));
		const headers = new Headers(res.headers);
		headers.set("Content-Encoding", "br");
		headers.set("Vary", "Accept-Encoding");
		headers.delete("Content-Length");
		return new Response(compressed, { status: res.status, headers });
	};
}
