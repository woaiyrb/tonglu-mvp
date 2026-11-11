import type { Offer, Unit } from "./types";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(value))
    .replaceAll("/", "-");
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function getUnitStats(unit: Unit, offers: Offer[]) {
  if (unit.stats) return unit.stats;
  const related = offers.find((offer) => offer.unitId === unit.id);
  const pendingDelta =
    related && related.status !== "pending" ? -1 : 0;
  const confirmedDelta = related?.status === "confirmed" ? 1 : 0;
  const pending = Math.max(0, unit.pending + pendingDelta);
  const confirmed = unit.confirmed + confirmedDelta;
  const remaining = Math.max(0, unit.quota - confirmed - pending);
  const fillRate = Math.round(((confirmed + pending) / unit.quota) * 100);
  return { pending, confirmed, remaining, fillRate };
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = "\uFEFF" + rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function scoreTone(score: number | null) {
  if (score === null) return "neutral";
  if (score >= 90) return "excellent";
  if (score >= 85) return "good";
  return "watch";
}
