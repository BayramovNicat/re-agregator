import { t } from "@/core/i18n";
import type { AlertFilters } from "@/core/types";
import { html } from "@/core/utils";
import { Button } from "@/ui/button";
import { Dialog } from "@/ui/dialog";
import { Field, Input } from "@/ui/input";
import type { AlertsCallbacks, AlertsUI } from "./types";

/**
 * Renders the alerts modal UI and populates refs.
 */
export function renderAlertsUI(
	ui: AlertsUI,
	handlers: AlertsCallbacks,
): HTMLElement {
	ui.chatIdInput = Input({
		id: "alert-chat-id",
		placeholder: t("chatIdPlaceholder"),
		className: "w-full",
		inputMode: "numeric",
		onchange: handlers.onChatIdChange,
	}) as HTMLInputElement;

	ui.labelInput = Input({
		id: "alert-label",
		placeholder: t("alertLabelPlaceholder"),
		className: "w-full",
		maxLength: 80,
	}) as HTMLInputElement;

	ui.previewEl = html`
		<div
			class="text-[11px] text-(--muted) bg-(--surface-2) border border-(--border) rounded-md px-3 py-2.5 leading-relaxed italic"
		></div>
	`;

	ui.itemsEl = html`<div class="flex flex-col gap-2"></div>`;
	ui.listEl = html`
		<div
			class="mb-6 hidden animate-in fade-in slide-in-from-top-2 duration-300"
		>
			<div
				class="text-[10px] font-bold text-(--muted) uppercase tracking-widest mb-3 opacity-70"
			>
				${t("activeAlerts")}
			</div>
			${ui.itemsEl}
			<div
				class="h-px bg-linear-to-r from-(--border) to-transparent my-6"
			></div>
		</div>
	`;

	ui.cancelBtn = Button({
		content: t("cancel"),
		variant: "base",
		color: "indigo",
		className: "px-5",
		onclick: handlers.onCancel,
	}) as HTMLButtonElement;

	ui.saveBtn = Button({
		content: t("saveAlert"),
		variant: "base",
		color: "solid",
		className: "px-6",
		onclick: handlers.onSave,
	}) as HTMLButtonElement;

	ui.modal = Dialog({
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
				${ui.listEl}

				<div class="flex flex-col gap-4">
					${Field({
						label: t("chatIdLabel"),
						input: ui.chatIdInput,
					})}
					${Field({
						label: t("alertLabel"),
						input: ui.labelInput,
					})}

					<div class="space-y-2 mt-1">
						<div
							class="text-[10px] font-bold text-(--muted) uppercase tracking-widest opacity-70"
						>
							${t("matchingFilters")}
						</div>
						${ui.previewEl}
					</div>

					<div
						class="flex gap-2 justify-end mt-4 pt-4 border-t border-(--border)/50"
					>
						${ui.cancelBtn} ${ui.saveBtn}
					</div>
				</div>
			</div>
		`,
	}) as AlertsUI["modal"];

	return ui.modal;
}

/**
 * Formats filters into a short preview string.
 */
export function buildFilterPreview(f: AlertFilters): string {
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
