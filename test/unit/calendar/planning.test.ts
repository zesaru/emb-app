import { expect, it } from "vitest";
import { buildCalendarPlanning } from "@/lib/calendar/planning";
import { buildCalendarEvents } from "@/lib/calendar/events";

const month = { start: "2026-10-01", end: "2026-11-01" };
const events = buildCalendarEvents([
  { id: "v1", start: "2026-09-30", finish: "2026-10-03", user1: { name: "Persona A" } },
  { id: "v2", start: "2026-10-03", finish: "2026-10-05", user1: { name: "Persona B" } },
  { id: "v3", start: "2026-11-01", finish: "2026-11-02", user1: { name: "Fuera del mes" } },
], [
  { id: "r", compensated_hours_day: "2026-10-06", compensated_hours: 2, t_time_start: "09:00", t_time_finish: "11:00", user1: { name: "Persona C" } },
  { id: "w", event_date: "2026-10-03", event_name: "Trabajo", user1: { name: "Persona D" } },
], { start: "2026-09-28", end: "2026-11-09" });

it("cuenta registros únicos del mes y solo vacaciones/descansos como ausencias", () => {
  const result = buildCalendarPlanning(events, month, "2026-10-03");
  expect(result.counts).toEqual({ vacation: 2, rest: 1, work: 1 });
  expect(result.today?.map(event => event.id)).toEqual(["vacation-v1", "vacation-v2"]);
  expect(result.overlaps.map(group => group.date)).toEqual(["2026-10-03"]);
  expect(result.upcoming.map(item => item.event.id)).toEqual(["compensatory-r"]);
});
it("ocultar fines de semana conserva vacaciones laborables y excluye trabajo de sábado", () => {
  const result = buildCalendarPlanning(events, month, "2026-10-03", false);
  expect(result.counts).toEqual({ vacation: 2, rest: 1, work: 0 });
  expect(result.today).toBeNull();
  expect(result.overlaps).toEqual([]);
});
it("no presenta cero ausencias hoy al consultar otro mes; limita próximas al mes consultado", () => {
  const result = buildCalendarPlanning(events, month, "2026-09-29");
  expect(result.today).toBeNull();
  expect(result.upcoming.map(item => item.date)).toEqual(["2026-10-01", "2026-10-03", "2026-10-06"]);
});
it("coincidencias requieren distintos nombres identificados; no duplica registros de una persona", () => {
  const same = [events[0], { ...events[0], id: "duplicate" }];
  expect(buildCalendarPlanning(same, month, "2026-10-01").overlaps).toEqual([]);
});
