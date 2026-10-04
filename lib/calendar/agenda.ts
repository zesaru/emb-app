import { parseCalendarRange, type CalendarEvent, type CalendarRange } from "./events";

export function groupAgendaEvents(events: CalendarEvent[], range: CalendarRange, showWeekends = true) {
  if (!parseCalendarRange(range.start, range.end)) return [];
  const groups: Array<{ date: string; events: CalendarEvent[] }> = [];
  // Iterate literal calendar days with UTC arithmetic, independent of browser DST.
  const day = new Date(`${range.start}T00:00:00Z`);
  for (let date = range.start; date < range.end; day.setUTCDate(day.getUTCDate() + 1), date = day.toISOString().slice(0, 10)) {
    if (!showWeekends && (day.getUTCDay() === 0 || day.getUTCDay() === 6)) continue;
    const items = events.filter(event => {
      const start = event.start.slice(0, 10);
      return event.allDay && event.end
        ? start <= date && date < event.end.slice(0, 10)
        : start === date;
    }).sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title, "es") || a.id.localeCompare(b.id));
    if (items.length) groups.push({ date, events: items });
  }
  return groups;
}
