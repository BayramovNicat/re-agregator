import { getLang, setLang, t } from "../core/i18n";
import { cn, html, makeEventManager } from "../core/utils";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { openDistrictStats } from "./district-stats";
import { HealthStatus } from "./health-status";

const LANGS = [
	{ code: "en" as const, label: "EN" },
	{ code: "az" as const, label: "AZ" },
	{ code: "ru" as const, label: "RU" },
] as const;

/**
 * A dropdown language switcher component.
 * Uses the standard Button component for the trigger and provides a custom dropdown.
 */
function LangSwitcher(evm: ReturnType<typeof makeEventManager>): HTMLElement {
	const cur = getLang();

	const trigger = Button({
		content: html`
			<span class="flex items-center gap-1">
				${cur.toUpperCase()}
				${Icons.chevron({
					size: 10,
					className: "opacity-60 transition-transform group-[.open]:rotate-180",
				})}
			</span>
		`,
		variant: "padded",
		color: "indigo",
		className: "group h-7 px-2 font-bold",
	});

	const dropdown = html`
		<div
			class="absolute right-0 top-full mt-1.5 z-50 min-w-20 rounded-(--r-sm) border border-(--border) bg-(--surface) shadow-xl py-1 hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right"
		>
			${LANGS.map((lang) => {
				const isActive = cur === lang.code;
				const item = html`
					<button
						type="button"
						class="${cn(
							"w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors duration-100",
							isActive
								? "text-(--accent) bg-(--accent-dim)/30"
								: "text-(--muted) hover:text-(--text) hover:bg-(--surface-2)",
						)}"
					>
						${lang.label}
					</button>
				`;
				item.onclick = () => setLang(lang.code);
				return item;
			})}
		</div>
	`;

	const wrapper = html`<div class="relative">${trigger}${dropdown}</div>`;

	let open = false;
	const toggle = (force?: boolean) => {
		open = force ?? !open;
		dropdown.classList.toggle("hidden", !open);
		trigger.classList.toggle("open", open);
	};

	evm.add(trigger, "click", (e) => {
		e.stopPropagation();
		toggle();
	});

	evm.add(document, "click", (e) => {
		if (open && !wrapper.contains(e.target as Node)) {
			toggle(false);
		}
	});

	return wrapper;
}

/**
 * Initializes the application header.
 * @param container - The parent element to attach the header to.
 * @returns A cleanup function to remove event listeners.
 */
export function initHeader(container: HTMLElement): () => void {
	const evm = makeEventManager();

	const logo = html`
		<div class="flex items-center gap-3 group cursor-pointer select-none">
			<div
				class="w-9 h-9 rounded-(--r) bg-(--accent-dim) border border-(--accent-b)/30 flex items-center justify-center text-(--accent) shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:border-(--accent-b)/60 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
			>
				${Icons.home(20)}
			</div>
			<div class="flex flex-col -space-y-1">
				<span class="text-[15px] font-extrabold tracking-tight text-(--text)">
					${t("appName")}
				</span>
				<div class="flex items-center gap-1.5">
					<span
						class="text-[10px] font-medium text-(--muted) uppercase tracking-wider"
					>
						Real Estate Aggregator
					</span>
					${HealthStatus()}
				</div>
			</div>
		</div>
	`;

	evm.add(logo, "click", () => {
		if (window.location.pathname === "/" && !window.location.search) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		} else {
			window.location.href = "/";
		}
	});

	const statsBtn = Button({
		title: t("districtStats"),
		color: "indigo",
		variant: "square",
		ariaLabel: t("statsBtn"),
		content: Icons.barChart(14),
		className: "size-8",
		onclick: () => openDistrictStats(),
	});

	const header = html`
		<header
			class="flex items-center justify-between py-4 border-b border-(--border) mb-6"
		>
			${logo}
			<div class="flex items-center gap-2">
				${statsBtn}
				<div class="w-px h-4 bg-(--border) mx-1"></div>
				${LangSwitcher(evm)}
			</div>
		</header>
	`;

	container.appendChild(header);

	return () => {
		evm.cleanup();
		header.remove();
	};
}
