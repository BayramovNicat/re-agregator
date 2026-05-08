const reloadClients = new Set<{
	send(data: string): void;
	readyState: number;
}>();

export function startReloadServer() {
	Bun.serve({
		port: 3001,
		fetch(req, server) {
			if (server.upgrade(req)) return undefined as unknown as Response;
			return new Response("WS reload server", { status: 200 });
		},
		websocket: {
			open(ws) {
				reloadClients.add(ws);
			},
			close(ws) {
				reloadClients.delete(ws);
			},
			message() {},
		},
	});
}

export function notifyReloadClients() {
	for (const client of reloadClients) {
		try {
			client.send("reload");
		} catch {}
	}
}
