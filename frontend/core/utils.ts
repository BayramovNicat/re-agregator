import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getLang, type TranslationKey, t } from "./i18n";

/**
 * Rewrites a full-resolution URL to its 460×345 thumbnail variant.
 * @param src The original full-resolution image URL.
 * @returns The thumbnail URL.
 */
export function toThumbUrl(src: string): string {
	return src.replace("/uploads/full/", "/uploads/f460x345/");
}

// --- Trusted Types ---
interface TrustedHTML {
	__brand: "TrustedHTML";
}
interface TrustedScript {
	__brand: "TrustedScript";
}
interface TrustedScriptURL {
	__brand: "TrustedScriptURL";
}
interface TrustedTypePolicy {
	createHTML(html: string): TrustedHTML;
	createScript(script: string): TrustedScript;
	createScriptURL(url: string): TrustedScriptURL;
}
interface TrustedTypePolicyFactory {
	createPolicy(
		name: string,
		options: {
			createHTML?: (html: string) => string;
			createScript?: (script: string) => string;
			createScriptURL?: (url: string) => string;
		},
	): TrustedTypePolicy;
	readonly defaultPolicy?: TrustedTypePolicy;
}

declare global {
	interface Window {
		trustedTypes?: TrustedTypePolicyFactory;
	}
}

/**
 * Merges Tailwind classes using clsx and twMerge to handle conflicts.
 * @param inputs CSS classes, conditions, or arrays.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

const policy = window.trustedTypes?.createPolicy("redeal", {
	createHTML: (s: string) => s,
	createScript: (s: string) => s,
	createScriptURL: (s: string) => s,
});

// A default policy is used by the browser when a string is passed to a sink
// directly (e.g. by 3rd party libs like Leaflet, or Service Worker registration).
if (window.trustedTypes && !window.trustedTypes.defaultPolicy) {
	window.trustedTypes.createPolicy("default", {
		createHTML: (s: string) => s,
		createScript: (s: string) => s,
		createScriptURL: (s: string) => s,
	});
}

/**
 * Wraps a string in a TrustedHTML object if the browser supports it.
 * @param html The raw HTML string.
 */
export const trust = (html: string): string | TrustedHTML => {
	return policy ? policy.createHTML(html) : html;
};

/**
 * Wraps a string in a TrustedScriptURL object if the browser supports it.
 * @param url The raw script URL.
 */
export const trustScriptURL = (url: string): string | TrustedScriptURL => {
	return policy ? policy.createScriptURL(url) : url;
};

/**
 * Initializes the global toasts container in the DOM.
 * @param root The element to append the container to.
 */
export function renderToastsContainer(root: HTMLElement): void {
	const el = document.createElement("div");
	el.id = "toasts";
	el.className =
		"fixed bottom-5 right-5 z-999 flex flex-col gap-2 pointer-events-none";
	root.appendChild(el);
}

/**
 * Short for document.getElementById.
 * @param id The element ID.
 * @returns The element cast to HTMLElement.
 */
export function ge(id: string): HTMLElement {
	return document.getElementById(id) as HTMLElement;
}

/**
 * Removes the 'hidden' class and optionally sets a specific display style.
 * @param target ID string or HTMLElement.
 * @param d Optional display style (e.g. "flex", "block").
 */
export function show(target: string | HTMLElement, d?: string): void {
	const e = typeof target === "string" ? ge(target) : target;
	if (e) {
		e.classList.remove("hidden");
		e.style.display = d ?? "";
	}
}

/**
 * Hides an element by setting display: none.
 * @param target ID string or HTMLElement.
 */
export function hide(target: string | HTMLElement): void {
	const e = typeof target === "string" ? ge(target) : target;
	if (e) e.style.display = "none";
}

/**
 * Returns the RFC 5646 locale string based on the current application language.
 */
export function getLocale(): string {
	const lang = getLang();
	if (lang === "az") return "az-AZ";
	if (lang === "ru") return "ru-RU";
	return "en-GB";
}

/**
 * Formats a number for the current locale.
 * @param n Number or string to format.
 * @param d Maximum fraction digits.
 */
export function fmt(n: number | string, d = 0): string {
	return Number(n).toLocaleString(getLocale(), { maximumFractionDigits: d });
}

/**
 * Returns a human-readable relative time string (e.g. "5 min ago").
 * Falls back to a localized date string for older dates.
 * @param s ISO date string.
 */
export function timeAgo(s: string | null | undefined): string | null {
	if (!s) return null;
	const sec = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
	if (sec < 3600) return `${Math.floor(sec / 60)}${t("unitMin")} ${t("ago")}`;
	if (sec < 86400)
		return `${Math.floor(sec / 3600)}${t("unitHour")} ${t("ago")}`;
	if (sec < 604800)
		return `${Math.floor(sec / 86400)}${t("unitDay")} ${t("ago")}`;
	return new Date(s).toLocaleDateString(getLocale(), {
		day: "numeric",
		month: "short",
	});
}

/**
 * Displays a transient toast notification in the corner of the screen.
 * @param msg The message to display.
 * @param err Whether to style it as an error.
 */
export function toast(msg: string, err = false): void {
	const el = html`<div
		class="bg-(--surface-3) border border-(--border) rounded-(--r) px-4 py-2.5 text-[13px] text-(--text-2) shadow-[0_4px_20px_rgba(0,0,0,0.5)] pointer-events-auto animate-[fadeUp_0.2s_ease] ${
			err ? "border-(--red-b) text-(--red)" : ""
		}"
	>
		${msg}
	</div>`;
	ge("toasts").appendChild(el);
	setTimeout(() => el.remove(), 3800);
}

/**
 * Formats a floor string (e.g. "5/9" or just "5" if total is missing).
 */
export function fmtFloor(
	f: number | null | undefined,
	t: number | null | undefined,
): string {
	if (f != null && t != null) return `${f}/${t}`;
	return f?.toString() ?? "—";
}

/**
 * Translates a property tier name (e.g. "Good Deal").
 * @param tier Internal tier string.
 * @param short Whether to return the abbreviated form.
 */
export function tTier(tier: string, short = false): string {
	const map: Record<string, TranslationKey> = {
		"High Value Deal": short ? "tierHighShort" : "tierHigh",
		"Good Deal": short ? "tierGoodShort" : "tierGood",
		"Fair Price": short ? "tierFairShort" : "tierFair",
		Overpriced: short ? "tierOverpricedShort" : "tierOverpriced",
	};
	const key = map[tier] || (short ? "tierNormalShort" : "tierNormal");
	return t(key);
}

const _template = document.createElement("template");

const _parse = (
	strings: TemplateStringsArray,
	values: unknown[],
): DocumentFragment => {
	const elementsMap = new Map<string, Node>();
	let idCounter = 0;

	const processValue = (val: unknown): string => {
		if (val instanceof Node) {
			const id = `__ref_${idCounter++}__`;
			elementsMap.set(id, val);
			return `<template data-ref="${id}"></template>`;
		}

		if (Array.isArray(val)) {
			return val.map(processValue).join("");
		}

		return String(val ?? "");
	};

	const rawHtml = strings.reduce((result, str, i) => {
		return result + str + (i < values.length ? processValue(values[i]) : "");
	}, "");

	const trimmed = rawHtml.trim();
	if (policy) {
		(_template as unknown as { innerHTML: TrustedHTML }).innerHTML =
			policy.createHTML(trimmed);
	} else {
		_template.innerHTML = trimmed;
	}
	const content = document.importNode(_template.content, true);

	content.querySelectorAll("template[data-ref]").forEach((placeholder) => {
		const id = placeholder.getAttribute("data-ref");
		if (id) {
			const realNode = elementsMap.get(id);
			if (realNode) placeholder.replaceWith(realNode);
		}
	});

	return content;
};

/**
 * Tagged template literal for creating a single root HTMLElement.
 * Supports nested Node objects via <template data-ref> injection.
 * @throws {Error} if the template doesn't contain a root element.
 */
export function html<T extends HTMLElement = HTMLElement>(
	strings: TemplateStringsArray,
	...values: unknown[]
): T {
	const content = _parse(strings, values);
	const el = content.firstElementChild;
	if (!el)
		throw new Error("html`` utility requires at least one root element.");

	return el as T;
}

/**
 * Tagged template literal for creating a DocumentFragment.
 * Useful for rendering multiple top-level elements or text nodes.
 */
export const frag = (
	strings: TemplateStringsArray,
	...values: unknown[]
): DocumentFragment => {
	return _parse(strings, values);
};

/**
 * Factory for creating a scoped event manager.
 * Tracks all added listeners and provides a single cleanup method.
 */
export function makeEventManager() {
	const handlers: [HTMLElement | Document | Window, string, EventListener][] =
		[];
	const add = <T extends Event>(
		el: HTMLElement | Document | Window,
		ev: string,
		fn: (e: T) => void,
	) => {
		const listener = fn as EventListener;
		el.addEventListener(ev, listener);
		handlers.push([el, ev, listener]);
	};
	const cleanup = () => {
		handlers.forEach(([el, ev, fn]) => {
			el.removeEventListener(ev, fn);
		});
	};
	return { add, cleanup };
}

/**
 * Short for "Create Element" or "Configure Element".
 * Assigns properties and dataset to an element.
 * @param el The element to configure.
 * @param props Properties and dataset to apply.
 * @returns The configured element.
 */
export function ce<T extends HTMLElement>(
	el: T,
	props: Partial<T> & { dataset?: Record<string, string | undefined> },
): T {
	const { dataset, ...rest } = props;
	if (dataset) Object.assign(el.dataset, dataset);
	Object.assign(el, rest);
	return el;
}
/**
 * Standard debounce implementation.
 * @param fn The function to debounce.
 * @param ms Delay in milliseconds.
 * @returns A debounced version of the function.
 */
export function debounce<T extends unknown[]>(
	fn: (...args: T) => unknown,
	ms: number,
): (...args: T) => void {
	let timeoutId: ReturnType<typeof setTimeout>;
	return (...args: T) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), ms);
	};
}
