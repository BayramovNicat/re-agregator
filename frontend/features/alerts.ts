import { bus, EVENTS } from "../core/events";
import { t } from "../core/i18n";
import { state } from "../core/state";
import type { Alert, AlertFilters } from "../core/types";
import { html, toast } from "../core/utils";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Icons } from "../ui/icons";
import { Field, Input } from "../ui/input";

/**
 * Alerts Feature Module
 * Manages Telegram notification subscriptions and user alert preferences.
 */
export function initAlerts(root: HTMLElement): () => void {
	const state_local = {
		isSaving: false,
		isLoadingAlerts: false,
	};

	// --- 1. Core Logic ---

	const fetchAlerts = async (chatId: string) => {
		if (!chatId || !/^\d+$/.test(chatId)) {
			updateAlertList([], ui.itemsEl, ui.listEl, handleDelete);
			return;
		}

		state_local.isLoadingAlerts = true;
		try {
			const res = await fetch(
				`/api/alerts?chat_id=${encodeURIComponent(chatId)}`,
			);
			const d = (await res.json()) as { alerts?: Alert[] };
			updateAlertList(d.alerts ?? [], ui.itemsEl, ui.listEl, handleDelete);
		} catch (e) {
			console.error("[Alerts] fetchAlerts failed:", e);
			updateAlertList([], ui.itemsEl, ui.listEl, handleDelete);
		} finally {
			state_local.isLoadingAlerts = false;
		}
	};

	const handleOpen = () => {
		const currentFilters = state.getFilters();
		ui.previewEl.textContent = buildFilterPreview(currentFilters);

		const savedChatId = localStorage.getItem("re-chatid") ?? "";
		ui.chatIdInput.value = savedChatId;
		ui.labelInput.value = "";

		void fetchAlerts(savedChatId);
		ui.modal.showModal();
	};

	const handleSave = async () => {
		const chatId = ui.chatIdInput.value.trim();
		if (!/^\d+$/.test(chatId)) {
			toast(t("invalidChatId"), true);
			return;
		}

		state_local.isSaving = true;
		ui.saveBtn.disabled = true;

		try {
			const res = await fetch("/api/alerts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chat_id: chatId,
					label: ui.labelInput.value.trim() || undefined,
					filters: state.getFilters(),
				}),
			});

			const d = (await res.json()) as { error?: string };
			if (!res.ok || d.error) {
				toast(d.error ?? t("failedAlert"), true);
				return;
			}

			localStorage.setItem("re-chatid", chatId);
			ui.modal.close();
			toast(t("alertSaved"));
		} catch (e) {
			toast((e as Error).message, true);
		} finally {
			state_local.isSaving = false;
			ui.saveBtn.disabled = false;
		}
	};

	const handleDelete = async (token: string, rowEl: HTMLElement) => {
		try {
			const res = await fetch(`/api/alerts/${token}`, { method: "DELETE" });
			if (!res.ok) throw new Error("Delete failed");

			rowEl.remove();
			if (ui.itemsEl.children.length === 0) {
				ui.listEl.style.display = "none";
			}
			toast(t("alertDeleted"));
		} catch (e) {
			console.error("[Alerts] delete failed:", e);
			toast(t("failedAlert"), true);
		}
	};

	const handleChatIdChange = () => {
		const chatId = ui.chatIdInput.value.trim();
		if (/^\d+$/.test(chatId)) void fetchAlerts(chatId);
	};

	const ui = createUI({
		onChatIdChange: () => handleChatIdChange(),
		onSave: () => void handleSave(),
		onCancel: () => ui.modal.close(),
	});
	root.appendChild(ui.modal);

	// --- 2. Listeners ---

	const cleanups: (() => void)[] = [];

	// Activation via event bus (triggered from Products feature)
	cleanups.push(bus.on(EVENTS.ALERTS_OPEN, handleOpen));

	// Update preview if filters change while modal is open
	cleanups.push(
		bus.on(EVENTS.DEALS_UPDATED, () => {
			if (ui.modal.open) {
				ui.previewEl.textContent = buildFilterPreview(state.getFilters());
			}
		}),
	);

	return () => {
		cleanups.forEach((fn) => {
			fn();
		});
		ui.modal.remove();
	};
}

/**
 * Creates the UI shell for the Alerts feature.
 * Encapsulates element creation and layout.
 */
function createUI(handlers: {
	onChatIdChange: () => void;
	onSave: () => void;
	onCancel: () => void;
}) {
	const chatIdInput = Input({
		id: "alert-chat-id",
		placeholder: t("chatIdPlaceholder"),
		className: "w-full",
		inputMode: "numeric",
		onchange: handlers.onChatIdChange,
	});

	const labelInput = Input({
		id: "alert-label",
		placeholder: t("alertLabelPlaceholder"),
		className: "w-full",
		maxLength: 80,
	});

	const previewEl = html`
		<div
			class="text-[11px] text-(--muted) bg-(--surface-2) border border-(--border) rounded-md px-3 py-2.5 leading-relaxed italic"
		></div>
	`;

	const itemsEl = html`<div class="flex flex-col gap-2"></div>`;
	const listEl = html`
		<div
			class="mb-6 hidden animate-in fade-in slide-in-from-top-2 duration-300"
		>
			<div
				class="text-[10px] font-bold text-(--muted) uppercase tracking-widest mb-3 opacity-70"
			>
				${t("activeAlerts")}
			</div>
			${itemsEl}
			<div
				class="h-px bg-linear-to-r from-(--border) to-transparent my-6"
			></div>
		</div>
	`;

	const cancelBtn = Button({
		content: t("cancel"),
		variant: "base",
		color: "indigo",
		className: "px-5",
		onclick: handlers.onCancel,
	});

	const saveBtn = Button({
		content: t("saveAlert"),
		variant: "base",
		color: "solid",
		className: "px-6",
		onclick: handlers.onSave,
	});

	const modal = Dialog({
		maxWidth: "440px",
		className: "p-0 overflow-hidden",
		title: t("telegramAlerts"),
		description: t("botInstruction", {
			bot: '<a href="https://t.me/BakuDealsBot" target="_blank" rel="noopener" class="text-(--blue) font-semibold hover:underline">@BakuDealsBot</a>',
			start:
				'<code class="bg-(--surface-3) px-1.5 py-0.5 rounded text-[10px] font-mono">/start</code>',
		}),
		content: html`
			<div class="p-6 overflow-y-auto min-h-0">
				${listEl}

				<div class="flex flex-col gap-4">
					${Field({
						label: t("chatIdLabel"),
						input: chatIdInput,
					})}
					${Field({
						label: t("alertLabel"),
						input: labelInput,
					})}

					<div class="space-y-2 mt-1">
						<div
							class="text-[10px] font-bold text-(--muted) uppercase tracking-widest opacity-70"
						>
							${t("matchingFilters")}
						</div>
						${previewEl}
					</div>

					<div
						class="flex gap-2 justify-end mt-4 pt-4 border-t border-(--border)/50"
					>
						${cancelBtn} ${saveBtn}
					</div>
				</div>
			</div>
		`,
	});

	return {
		modal,
		chatIdInput,
		labelInput,
		previewEl,
		itemsEl,
		listEl,
		cancelBtn,
		saveBtn,
	};
}

/**
 * Updates the alerts list in the modal with a premium look.
 */
function updateAlertList(
	alerts: Alert[],
	itemsEl: HTMLElement,
	listEl: HTMLElement,
	onDelete: (token: string, row: HTMLElement) => void,
): void {
	if (!alerts || alerts.length === 0) {
		listEl.style.display = "none";
		return;
	}

	listEl.style.display = "block";
	itemsEl.replaceChildren();

	for (const a of alerts) {
		const preview = buildFilterPreview({
			...(a.filters ?? {}),
			location: a.filters?.location ?? "",
			threshold: a.filters?.threshold ?? 10,
		});

		const delBtn = Button({
			content: Icons.trash(14),
			variant: "ghost",
			color: "red",
			title: t("deleteAlert"),
			className:
				"shrink-0 size-8 opacity-0 group-hover:opacity-100 transition-opacity",
			onclick: (e) => {
				const rowEl = (e.currentTarget as HTMLElement).closest(
					".group",
				) as HTMLElement;
				onDelete(a.token, rowEl);
			},
		});

		const row = html`
			<div
				class="group flex items-center gap-3 bg-(--surface-2) border border-(--border) rounded-xl px-3.5 py-3 transition-all hover:border-(--border-h) hover:shadow-sm"
			>
				<div class="flex-1 min-w-0">
					<div class="text-sm font-bold text-(--text) truncate mb-0.5">
						${a.label ?? t("unnamed")}
					</div>
					<div class="text-[11px] text-(--muted) truncate opacity-80">
						${preview}
					</div>
				</div>
				${delBtn}
			</div>
		`;

		itemsEl.appendChild(row);
	}
}

/**
 * Formats filters into a short preview string with icons.
 */
function buildFilterPreview(f: AlertFilters): string {
	const parts = [
		`📍 ${f.location === "__all__" ? t("allLocsPrev") : f.location}`,
		`📉 ≥${f.threshold}% ${t("belowAvg")}`,
	];

	if (f.minPrice || f.maxPrice) {
		parts.push(`₼ ${f.minPrice ?? "0"}–${f.maxPrice ?? "∞"}`);
	}
	if (f.minRooms || f.maxRooms) {
		parts.push(
			`${f.minRooms ?? "1"}–${f.maxRooms ?? "5"}+ ${t("previewRooms")}`,
		);
	}
	if (f.minArea || f.maxArea) {
		parts.push(`${f.minArea ?? "0"}–${f.maxArea ?? "∞"} ${t("previewArea")}`);
	}

	const bools: string[] = [];
	if (f.hasRepair) bools.push(t("previewRepaired"));
	if (f.hasDocument) bools.push(t("previewDocument"));
	if (f.isUrgent) bools.push(t("previewUrgent"));
	if (f.hasActiveMortgage === false) bools.push(t("previewNoActiveMortgage"));

	if (bools.length) parts.push(bools.join(", "));

	return parts.join(" · ");
}
