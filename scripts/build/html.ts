import { dirs } from "./config";

export async function writeIndexHtml() {
	let html = await Bun.file(`${dirs.frontend}/index.html`).text();
	const css = await Bun.file(`${dirs.public}/styles.css`).text();
	html = html.replace(
		/<link[^>]*href="\/styles\.css"[^>]*>/,
		() => `<style>${css}</style>`,
	);
	await Bun.write(`${dirs.public}/index.html`, html);
}
