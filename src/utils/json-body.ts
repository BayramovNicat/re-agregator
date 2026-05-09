export const JSON_BODY_MAX_BYTES = 512 * 1024;

export type JsonBodyResult<T> =
	| { ok: true; data: T }
	| { ok: false; status: 400 | 413 };

export async function readJsonBody<T>(
	req: Request,
	maxBytes = JSON_BODY_MAX_BYTES,
): Promise<JsonBodyResult<T>> {
	const contentLength = req.headers.get("content-length");
	if (contentLength !== null) {
		const size = Number(contentLength);
		if (Number.isFinite(size) && size > maxBytes) {
			return { ok: false, status: 413 };
		}
	}

	if (!req.body) return { ok: false, status: 400 };

	const reader = req.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > maxBytes) {
				await reader.cancel();
				return { ok: false, status: 413 };
			}
			chunks.push(value);
		}
	} catch {
		return { ok: false, status: 400 };
	}

	try {
		const bytes = new Uint8Array(size);
		let offset = 0;
		for (const chunk of chunks) {
			bytes.set(chunk, offset);
			offset += chunk.byteLength;
		}
		return { ok: true, data: JSON.parse(new TextDecoder().decode(bytes)) as T };
	} catch {
		return { ok: false, status: 400 };
	}
}
