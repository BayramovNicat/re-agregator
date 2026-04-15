import { t } from "../core/i18n";
import { html } from "../core/utils";

export function HealthStatus(): HTMLElement {
	const text = html`<span class="health-txt">${t("statusLive")}</span>`;
	const dot = html`<div class="w-1.5 h-1.5 rounded-full bg-(--green) animate-[livepulse_2s_ease-in-out_infinite]"></div>`;

	const container = html`
		<div
			class="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full py-1.25 pr-3 pl-2 text-[11px] font-medium text-(--muted) select-none transition-colors hover:border-white/20"
			title="${t("allListings")}"
		>
			${dot}
			${text}
		</div>
	`;

	// Fetch health info
	void (async () => {
		try {
			const r = await fetch("/health");
			const d = (await r.json()) as { properties?: number };
			text.textContent = d.properties
				? `${d.properties.toLocaleString()} ${t(d.properties !== 1 ? "listings" : "listing")}`
				: `0 ${t("listings")}`;
		} catch {
			text.textContent = t("statusDown");
			dot.classList.remove("bg-(--green)");
			dot.classList.add("bg-(--muted)");
			dot.classList.remove("animate-[livepulse_2s_ease-in-out_infinite]");
		}
	})();

	return container;
}
