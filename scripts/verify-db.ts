export {};

const databaseUrl = process.env.DATABASE_URL;
const port = Number(process.env.TEST_PORT ?? 3100);
const baseUrl = `http://localhost:${port}`;

if (!databaseUrl) throw new Error("DATABASE_URL is required");

async function run(command: string[], env: Record<string, string> = {}) {
	const proc = Bun.spawn(command, {
		stdout: "inherit",
		stderr: "inherit",
		env: { ...process.env, ...env },
	});
	const code = await proc.exited;
	if (code !== 0) throw new Error(`${command.join(" ")} exited with ${code}`);
}

async function waitForHealth() {
	const deadline = Date.now() + 20_000;
	let lastError: unknown;

	while (Date.now() < deadline) {
		try {
			const res = await fetch(`${baseUrl}/health`);
			if (res.ok) return;
		} catch (error) {
			lastError = error;
		}
		await Bun.sleep(250);
	}

	throw new Error(`Server did not become healthy at ${baseUrl}: ${String(lastError)}`);
}

await run(["bun", "run", "db:push"]);
await run(["bun", "scripts/seed-test-db.ts"]);

const server = Bun.spawn(["bun", "src/index.ts"], {
	stdout: "inherit",
	stderr: "inherit",
	env: { ...process.env, PORT: String(port), NODE_ENV: "test" },
});

try {
	await waitForHealth();
	await run(["bun", "test", "tests/api"], { TEST_BASE_URL: baseUrl });
} finally {
	server.kill();
	await server.exited.catch(() => {});
}
