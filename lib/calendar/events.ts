import { formatInTimeZone } from "date-fns-tz";

export type CalendarRange = { start: string; end: string };
export type CalendarVacation = {
  id: string; start: string | null; finish: string | null;
  user1: { name: string | null } | null;
};
export type CalendarCompensatory = {
  id: string; event_date?: string | null; event_name?: string | null;
  compensated_hours_day?: string | null; compensated_hours?: number | null;
  t_time_start?: string | null; t_time_finish?: string | null;
  user1: { name: string | null } | null;
};
export type CalendarEvent = {
  id: string; title: string; start: string; end?: string; allDay: boolean;
  backgroundColor: string; borderColor: string;
  extendedProps: {
    type: "vacation" | "compensatory";
    personName?: string;
    eventName?: string | null;
    compensatedHours?: number | null;
  };
};

export function parseCalendarRange(start: string | null, end: string | null): CalendarRange | null {
  const valid = (value: string | null): value is string => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!valid(start) || !valid(end)) return null;
  const days = (Date.parse(end) - Date.parse(start)) / 86_400_000;
  return days > 0 && days <= 62 ? { start, end } : null;
}

function tokyoDate(value: string): string {
  // Date-only database values are calendar days, not instants.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : formatInTimeZone(new Date(value), "Asia/Tokyo", "yyyy-MM-dd");
}

export function buildCalendarEvents(vacations: CalendarVacation[], compensatorys: CalendarCompensatory[], range: CalendarRange): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const item of vacations) {
    if (!item.start || !item.finish) continue;
    const start = tokyoDate(item.start);
    const finish = tokyoDate(item.finish);
    if (start >= range.end || finish < range.start) continue;
    // Vacation finish is inclusive; FullCalendar's end is exclusive.
    const end = new Date(`${finish}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    events.push({ id: `vacation-${item.id}`, title: `🏖️ ${item.user1?.name || "Usuario"}`, start,
      end: end.toISOString().slice(0, 10), allDay: true, backgroundColor: "#047857", borderColor: "#065f46", extendedProps: { type: "vacation", personName: item.user1?.name || "Usuario" } });
  }
  for (const item of compensatorys) {
    const timed = Boolean(item.compensated_hours_day && item.t_time_start && item.t_time_finish);
    const day = timed ? item.compensated_hours_day : item.event_date;
    if (!day || day < range.start || day >= range.end || (!timed && !item.event_name)) continue;
    events.push({ id: `compensatory-${item.id}`,
      title: `💼 ${item.user1?.name || "Usuario"}: ${timed ? `${item.compensated_hours}h` : item.event_name}`,
      // These are Tokyo wall-clock values. The named calendar zone keeps them independent of the browser zone.
      start: timed ? `${day}T${item.t_time_start}` : day,
      ...(timed ? { end: `${day}T${item.t_time_finish}` } : {}),
      allDay: !timed, backgroundColor: timed ? "#2563eb" : "#b45309", borderColor: timed ? "#1d4ed8" : "#92400e", extendedProps: {
        type: "compensatory", personName: item.user1?.name || "Usuario",
        eventName: item.event_name, compensatedHours: item.compensated_hours,
      } });
  }
  return events;
}
