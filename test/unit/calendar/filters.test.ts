import { expect, it } from "vitest";
import { matchesCalendarFilters, calendarEventKind } from "@/lib/calendar/filters";
import type { CalendarEvent } from "@/lib/calendar/events";

const event = (personName: string, type: "vacation" | "compensatory", allDay: boolean) => ({ title: "Trabajo de otra persona", allDay, extendedProps: { personName, type } } as CalendarEvent);
it("distingue vacaciones, descanso y trabajo sin cambiar el contrato de la API", () => {
  expect(calendarEventKind(event("A", "vacation", true))).toBe("vacation");
  expect(calendarEventKind(event("A", "compensatory", false))).toBe("rest");
  expect(calendarEventKind(event("A", "compensatory", true))).toBe("work");
});
it("combina búsqueda literal por persona y tipo, sin distinguir acentos o mayúsculas", () => {
  const item = event("María López", "compensatory", false);
  expect(matchesCalendarFilters(item, { person: "  MARIA  ", kind: "rest" })).toBe(true);
  expect(matchesCalendarFilters(item, { person: "María", kind: "work" })).toBe(false);
  expect(matchesCalendarFilters(item, { person: "otra persona", kind: "all" })).toBe(false);
  expect(matchesCalendarFilters(item, { person: ".*", kind: "all" })).toBe(false);
  expect(matchesCalendarFilters(item, { person: "", kind: "all" })).toBe(true);
});
