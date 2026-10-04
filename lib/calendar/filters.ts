import type { CalendarEvent } from "./events";

export type CalendarEventKind = "vacation" | "rest" | "work";
export type CalendarFilters = { person: string; kind: CalendarEventKind | "all" };
type EventIdentity = Pick<CalendarEvent, "allDay" | "extendedProps">;

export const calendarKindLabels: Record<CalendarEventKind, string> = {
  vacation: "Vacaciones", rest: "Descanso compensatorio", work: "Trabajo adicional",
};
export function calendarEventKind(event: EventIdentity): CalendarEventKind {
  return event.extendedProps.type === "vacation" ? "vacation" : event.allDay ? "work" : "rest";
}
function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}
export function matchesCalendarFilters(event: EventIdentity, filters: CalendarFilters) {
  return (filters.kind === "all" || calendarEventKind(event) === filters.kind)
    && normalize(event.extendedProps.personName || "Usuario").includes(normalize(filters.person));
}
