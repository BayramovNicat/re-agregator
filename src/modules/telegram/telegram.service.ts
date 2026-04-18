const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const BASE = `https://api.telegram.org/bot${TOKEN}`;

export async function sendMessage(chatId: string, text: string): Promise<void> {
	if (!TOKEN) return;
	try {
		await fetch(`${BASE}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
		});
	} catch (err) {
		console.error("[Telegram] sendMessage failed:", err);
	}
}
