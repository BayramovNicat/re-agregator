import { mkdirSync, readFileSync, watch, writeFileSync } from "node:fs";
import { transform } from "lightningcss";
import { rolldown } from "rolldown";

const watchMode = process.argv.includes("--watch");

mkdirSync("./public", { recursive: true });

async function build() {
	const bundle = await rolldown({
		input: "./frontend/main.ts",
		platform: "browser",
	});

	await bundle.write({
		dir: "./public",
		entryFileNames: "app.js",
		format: "iife",
		minify: true,
	});

	const cssInput = readFileSync("./frontend/styles.css");
	const { code: cssOutput } = transform({
		filename: "styles.css",
		code: cssInput,
		minify: true,
	});
	writeFileSync("./public/styles.css", cssOutput);

	await Bun.write("./public/index.html", Bun.file("./frontend/index.html"));

	const jsSizeKB = (readFileSync("./public/app.js").length / 1024).toFixed(1);
	const cssSizeKB = (cssOutput.length / 1024).toFixed(1);
	console.log(
		`Built public/  app.js ${jsSizeKB} KB  styles.css ${cssSizeKB} KB  index.html ✓`,
	);
}

await build();

if (watchMode) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	watch("./frontend", { recursive: true }, (_event, filename) => {
		if (!filename) return;
		if (timer) clearTimeout(timer);
		timer = setTimeout(async () => {
			process.stdout.write(`[watch] ${filename} → rebuilding...\n`);
			await build();
		}, 80);
	});
	console.log("Watching frontend/ for changes...");
}
