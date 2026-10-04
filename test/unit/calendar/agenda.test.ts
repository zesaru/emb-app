import { describe, expect, it } from "vitest";
import { groupAgendaEvents } from "@/lib/calendar/agenda";
import type { CalendarEvent } from "@/lib/calendar/events";

function event(id: string, start: string, end?: string, allDay = true): CalendarEvent {
  return { id, title: id, start, end, allDay, backgroundColor: "", borderColor: "", extendedProps: { type: allDay ? "vacation" : "compensatory" } };
}

describe("agenda por días de Tokio", () => {
  it("oculta fines de semana sin perder los días laborables de unas vacaciones", () => {
    const events = [event("v", "2026-10-02", "2026-10-06"), event("extra", "2026-10-03")];
    expect(groupAgendaEvents(events, { start: "2026-10-01", end: "2026-11-01" }, false).map(group => group.date)).toEqual(["2026-10-02", "2026-10-05"]);
  });
  it("recorta vacaciones al mes y conserva el último día inclusivo y los fines de semana", () => {
    const groups = groupAgendaEvents([event("cruce", "2026-09-30", "2026-10-04"), event("fuera", "2026-09-01", "2026-09-02")], { start: "2026-10-01", end: "2026-11-01" });
    expect(groups.map(group => group.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(groups.every(group => group.events.length === 1 && group.events[0].id === "cruce")).toBe(true);
  });
  it("ordena días y eventos; los descansos conservan el día literal aunque tengan offset", () => {
    const groups = groupAgendaEvents([
      event("tarde", "2026-10-02T13:00:00+09:00", "2026-10-02T14:00:00+09:00", false),
      event("mañana", "2026-10-02T09:00:00", "2026-10-02T10:00:00", false),
      event("vacaciones", "2026-10-02", "2026-10-03"),
      event("primero", "2026-10-01"),
    ], { start: "2026-10-01", end: "2026-10-03" });
    expect(groups.map(group => group.date)).toEqual(["2026-10-01", "2026-10-02"]);
    expect(groups[1].events.map(item => item.id)).toEqual(["vacaciones", "mañana", "tarde"]);
  });
  it("no pierde días en el cambio de horario de verano y excluye el final del intervalo", () => {
    expect(groupAgendaEvents([event("v", "2026-03-07", "2026-03-10")], { start: "2026-03-07", end: "2026-03-09" }).map(group => group.date)).toEqual(["2026-03-07", "2026-03-08"]);
    expect(groupAgendaEvents([], { start: "2026-10-01", end: "2026-11-01" })).toEqual([]);
  });
});
