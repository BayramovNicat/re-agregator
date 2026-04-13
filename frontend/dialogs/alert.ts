import type { Alert, AlertFilters } from "../core/types";
import { ge, html, toast } from "../core/utils";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Icons } from "../ui/icons";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function initAlerts(root: HTMLElement): void {
  // Render modal
  root.appendChild(
    Dialog({
      id: "alert-modal",
      width: "min(440px,calc(100vw-2rem))",
      className: "p-6",
      content: html`<div>
        <div class="text-base font-semibold text-(--text) mb-4">
          Telegram alerts
        </div>

        <div id="alert-list" class="mb-4 hidden">
          <div
            class="text-xs font-semibold text-(--muted) uppercase tracking-[0.05em] mb-2"
          >
            Active alerts
          </div>
          <div id="alert-list-items" class="flex flex-col gap-6"></div>
          <div class="h-px bg-(--border) my-4"></div>
        </div>

        <div class="text-xs text-(--muted) leading-[1.6] mb-3.5">
          Open
          <a
            href="https://t.me/BakuDealsBot"
            target="_blank"
            rel="noopener"
            class="text-(--blue)"
            >@BakuDealsBot</a
          >
          and send
          <code class="bg-(--surface-3) px-1 py-0.5 rounded-sm">/start</code> to
          get your Chat ID.
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            ${Label({ htmlFor: "alert-chat-id", text: "Telegram Chat ID" })}
            ${Input({
              id: "alert-chat-id",
              placeholder: "e.g. 123456789",
              className: "w-full",
              attrs: { inputmode: "numeric" },
            })}
          </div>
          <div class="flex flex-col gap-1.5">
            ${Label({ htmlFor: "alert-label", text: "Label (optional)" })}
            ${Input({
              id: "alert-label",
              placeholder: "e.g. 2BR Nərimanov",
              className: "w-full",
              attrs: { maxlength: "80" },
            })}
          </div>
          <div
            class="text-xs text-(--muted) bg-(--surface-2) border border-(--border) rounded-sm px-2.5 py-2"
            id="alert-filter-preview"
          ></div>
          <div class="flex gap-2 justify-end mt-1">
            ${Button({
							id: "alert-cancel",
							content: "Cancel",
							variant: "base",
							color: "indigo",
						})}
            ${Button({
							id: "alert-save",
							content: "Save alert",
							variant: "base",
							color: "solid",
						})}
          </div>
        </div>
      </div> `,
    }),
  );

  // Setup Event Listeners
  const modal = ge("alert-modal") as HTMLDialogElement;
  const trigger = ge("alert-btn");

  if (trigger) {
    trigger.addEventListener("click", () => {
      const f = getCurrentFilters();
      ge("alert-filter-preview").textContent = buildFilterPreview(f);
      const savedChatId = localStorage.getItem("re-chatid") ?? "";
      (ge("alert-chat-id") as HTMLInputElement).value = savedChatId;
      (ge("alert-label") as HTMLInputElement).value = "";
      void fetchAndRenderAlerts(savedChatId);
      modal.showModal();
    });
  }

  ge("alert-chat-id").addEventListener("change", () => {
    const chatId = (ge("alert-chat-id") as HTMLInputElement).value.trim();
    if (/^\d+$/.test(chatId)) void fetchAndRenderAlerts(chatId);
  });

  ge("alert-cancel").addEventListener("click", () => modal.close());

  modal.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) modal.close();
  });

  ge("alert-save").addEventListener("click", async () => {
    const chatId = (ge("alert-chat-id") as HTMLInputElement).value.trim();
    if (!/^\d+$/.test(chatId)) {
      toast("Enter a valid Telegram Chat ID (digits only)", true);
      return;
    }
    const filters = getCurrentFilters();
    const labelVal = (ge("alert-label") as HTMLInputElement).value.trim();
    const label = labelVal || undefined;

    (ge("alert-save") as HTMLButtonElement).disabled = true;
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, label, filters }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok || d.error) {
        toast(d.error ?? "Failed to create alert", true);
        return;
      }
      localStorage.setItem("re-chatid", chatId);
      modal.close();
      toast(
        "Alert saved! You'll get a Telegram message when new deals appear.",
      );
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      (ge("alert-save") as HTMLButtonElement).disabled = false;
    }
  });
}

function getCurrentFilters(): AlertFilters {
  function v(id: string): string {
    return (ge(id) as HTMLInputElement).value.trim();
  }
  function cb(id: string): boolean {
    return (ge(id) as HTMLInputElement).checked;
  }

  const filters: AlertFilters = {
    location: (ge("loc") as HTMLSelectElement).value,
    threshold: Number((ge("thresh") as HTMLInputElement).value),
  };

  const numIds = [
    "minPrice",
    "maxPrice",
    "minArea",
    "maxArea",
    "minRooms",
    "maxRooms",
    "minFloor",
    "maxFloor",
    "minTotalFloors",
    "maxTotalFloors",
  ] as const;
  for (const id of numIds) {
    const val = v(id);
    if (val) (filters as unknown as Record<string, unknown>)[id] = Number(val);
  }

  if (v("category")) filters.category = v("category");
  if (cb("hasRepair")) filters.hasRepair = true;
  if (cb("hasDocument")) filters.hasDocument = true;
  if (cb("hasMortgage")) filters.hasMortgage = true;
  if (cb("isUrgent")) filters.isUrgent = true;
  if (cb("notLastFloor")) filters.notLastFloor = true;
  if (cb("noActiveMortgage")) filters.hasActiveMortgage = false;
  else if (cb("hasActiveMortgage")) filters.hasActiveMortgage = true;

  return filters;
}

function buildFilterPreview(f: AlertFilters): string {
  const parts = [
    `📍 ${f.location === "__all__" ? "All locations" : f.location}`,
    `📉 ≥${f.threshold}% below avg`,
  ];
  if (f.minPrice || f.maxPrice)
    parts.push(`₼ ${f.minPrice ?? ""}-${f.maxPrice ?? ""}`);
  if (f.minRooms || f.maxRooms)
    parts.push(`${f.minRooms ?? ""}-${f.maxRooms ?? ""} rooms`);
  if (f.minArea || f.maxArea)
    parts.push(`${f.minArea ?? ""}-${f.maxArea ?? ""}m²`);
  if (f.hasRepair) parts.push("Repaired");
  if (f.hasDocument) parts.push("Document");
  if (f.isUrgent) parts.push("Urgent");
  if (f.hasActiveMortgage === false) parts.push("No active mortgage");
  return parts.join(" · ");
}

function renderAlertList(alerts: Alert[]): void {
  const listEl = ge("alert-list");
  const itemsEl = ge("alert-list-items");
  if (!alerts || alerts.length === 0) {
    listEl.style.display = "none";
    return;
  }
  listEl.style.display = "block";
  itemsEl.innerHTML = "";
  for (const a of alerts) {
    const preview = buildFilterPreview({
      ...(a.filters ?? {}),
      location: a.filters?.location ?? "",
      threshold: a.filters?.threshold ?? 10,
    });
    const row = html`<div
      class="flex items-center gap-2 bg-(--surface-2) border border-(--border) rounded-md px-2.5 py-2"
    >
      <div class="flex-1 min-w-0">
        <div
          class="text-[12px] font-semibold text-(--text) whitespace-nowrap overflow-hidden text-ellipsis"
        >
          ${a.label ?? "Unnamed"}
        </div>
        <div
          class="text-[11px] text-(--muted) mt-px whitespace-nowrap overflow-hidden text-ellipsis"
        >
          ${preview}
        </div>
      </div>

      ${Button({
				content: Icons.trash(),
				variant: "ghost",
				color: "red",
				title: "Delete alert",
				className: "shrink-0",
			})}
    </div>`;
    const btn = row.querySelector("button");
    if (btn) {
      btn.addEventListener("click", () => deleteAlertRow(a.token, row));
    }
    itemsEl.appendChild(row);
  }
}

async function fetchAndRenderAlerts(chatId: string): Promise<void> {
  if (!chatId || !/^\d+$/.test(chatId)) {
    renderAlertList([]);
    return;
  }
  try {
    const res = await fetch(
      `/api/alerts?chat_id=${encodeURIComponent(chatId)}`,
    );
    const d = (await res.json()) as { alerts?: Alert[] };
    renderAlertList(d.alerts ?? []);
  } catch {
    renderAlertList([]);
  }
}

async function deleteAlertRow(
  token: string,
  rowEl: HTMLElement,
): Promise<void> {
  try {
    await fetch(`/api/alerts/${token}`, { method: "DELETE" });
  } catch {
    /* best effort */
  }
  rowEl.remove();
  const remaining = ge("alert-list-items").children.length;
  if (remaining === 0) ge("alert-list").style.display = "none";
  toast("Alert deleted");
}
