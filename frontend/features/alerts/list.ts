import { t } from "../../core/i18n";
import type { Alert } from "../../core/types";
import { html } from "../../core/utils";
import { Button } from "../../ui/button";
import { Icons } from "../../ui/icons";
import { buildFilterPreview } from "./ui";

/**
 * Updates the alerts list in the modal.
 */
export function renderAlertList(
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
