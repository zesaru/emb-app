import { groupAgendaEvents } from "./agenda";
import { calendarEventKind } from "./filters";
import type { CalendarEvent, CalendarRange } from "./events";

export function buildCalendarPlanning(events: CalendarEvent[], range: CalendarRange, today: string, showWeekends = true) {
  const groups = groupAgendaEvents(events, range, showWeekends);
  const counts = { vacation: 0, rest: 0, work: 0 };
  const seen = new Set<string>();
  const upcoming: Array<{ date: string; event: CalendarEvent }> = [];
  for (const group of groups) {
    for (const event of group.events) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      const kind = calendarEventKind(event);
      counts[kind]++;
      if (kind !== "work" && group.date > today && event.start.slice(0, 10) > today) {
        upcoming.push({ date: group.date, event });
      }
    }
  }
  const absences = groups.map(group => ({ ...group, events: group.events.filter(event => calendarEventKind(event) !== "work") }));
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const todayVisible = range.start <= today && today < range.end && (showWeekends || (weekday !== 0 && weekday !== 6));
  return {
    counts,
    today: todayVisible ? absences.find(group => group.date === today)?.events ?? [] : null,
    upcoming,
    // Names are the only identity in this DTO; unknown names cannot establish a coincidence.
    overlaps: absences.filter(group => new Set(group.events.map(event => event.extendedProps.personName?.trim().toLocaleLowerCase("es")).filter(name => name && name !== "usuario")).size > 1),
  };
}
