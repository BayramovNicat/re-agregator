import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serveStatic } from "../src/middleware/static.js";

let rootDir: string;
let publicDir: string;
let secretPath: string;

beforeEach(async () => {
	rootDir = await mkdtemp(join(tmpdir(), "redeal-static-"));
	publicDir = join(rootDir, "public");
	secretPath = join(rootDir, "secret.txt");

	await Bun.write(join(publicDir, "index.html"), "<html>app</html>");
	await Bun.write(join(publicDir, "main.js"), "console.log('ok');");
	await Bun.write(secretPath, "secret");
});

afterEach(async () => {
	await rm(rootDir, { recursive: true, force: true });
});

function request(path: string): Request {
	return new Request(`http://redeal.test${path}`);
}

describe("serveStatic", () => {
	test("serves valid static files", async () => {
		const res = await serveStatic(request("/main.js"), publicDir);

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("console.log('ok');");
	});

	test("falls back to index html for missing safe paths", async () => {
		const res = await serveStatic(request("/dashboard"), publicDir);

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
		expect(await res.text()).toBe("<html>app</html>");
	});

	test("rejects encoded dot-dot traversal", async () => {
		const res = await serveStatic(request("/%2e%2e%2fsecret.txt"), publicDir);

		expect(res.status).toBe(404);
		expect(await res.text()).toBe("Not Found");
	});

	test("rejects malformed percent encoding", async () => {
		const res = await serveStatic(request("/%E0%A4%A"), publicDir);

		expect(res.status).toBe(404);
		expect(await res.text()).toBe("Not Found");
	});

	test("rejects backslash traversal", async () => {
		const res = await serveStatic(request("/%2e%2e%5csecret.txt"), publicDir);

		expect(res.status).toBe(404);
		expect(await res.text()).toBe("Not Found");
	});

	test("rejects double-encoded dot-dot traversal", async () => {
		// %252e%252e%252f → decoded once to %2e%2e%2f → still rejected
		const res = await serveStatic(request("/%252e%252e%252fsecret.txt"), publicDir);

		expect(res.status).toBe(404);
		expect(await res.text()).toBe("Not Found");
	});

	test("rejects double-slash prefix", async () => {
		const res = await serveStatic(request("//secret.txt"), publicDir);

		expect(res.status).toBe(404);
		expect(await res.text()).toBe("Not Found");
	});
});
