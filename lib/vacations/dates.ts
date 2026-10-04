import { formatInTimeZone } from "date-fns-tz";

export function vacationDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return null;
  if (dateOnly) return date.toISOString().slice(0, 10) === value ? value : null;
  return formatInTimeZone(date, "Asia/Tokyo", "yyyy-MM-dd");
}

export function vacationToday(now = new Date()): string {
  return formatInTimeZone(now, "Asia/Tokyo", "yyyy-MM-dd");
}

export function vacationMonth(now = new Date()) {
  const today = vacationToday(now);
  const start = `${today.slice(0, 7)}-01`;
  const next = new Date(`${start}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start, end: next.toISOString().slice(0, 10) };
}

export function formatVacationDate(value: string | null | undefined): string {
  const day = vacationDate(value);
  return day ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}` : "—";
}

export function isVacationActive(start: string | null, finish: string | null, now = new Date()): boolean {
  const first = vacationDate(start), last = vacationDate(finish), today = vacationToday(now);
  return Boolean(first && last && first <= today && today <= last);
}
