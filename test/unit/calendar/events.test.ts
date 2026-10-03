import { describe, expect, it } from "vitest";
import { buildCalendarEvents, parseCalendarRange } from "@/lib/calendar/events";

describe("intervalo del calendario", () => {
  it("acepta un intervalo visible con final exclusivo", () => {
    expect(parseCalendarRange("2026-09-28", "2026-11-09")).toEqual({ start: "2026-09-28", end: "2026-11-09" });
  });
  it.each([
    ["2026-02-30", "2026-03-10"], ["2026-10-03", "2026-10-03"],
    ["2026-11-01", "2026-10-01"], ["2026-01-01", "2027-01-01"],
    ["2026-10-03),id.eq.x", "2026-11-01"],
  ])("rechaza fechas y rangos inválidos: %s", (start, end) => {
    expect(parseCalendarRange(start, end)).toBeNull();
  });
});

describe("eventos del calendario", () => {
  const range = { start: "2026-10-01", end: "2026-11-01" };
  it("convierte vacaciones a días de Tokio e incluye el último día", () => {
    const events = buildCalendarEvents([{ id: "v", start: "2026-09-30T15:00:00Z", finish: "2026-10-02T15:00:00Z", user1: { name: "Sistema" } }], [], range);
    expect(events[0]).toMatchObject({ start: "2026-10-01", end: "2026-10-04", allDay: true });
  });
  it("conserva vacaciones que cruzan el inicio visible", () => {
    expect(buildCalendarEvents([{ id: "v", start: "2026-09-20", finish: "2026-10-01", user1: null }], [], range)).toHaveLength(1);
  });
  it("elige el descanso antes del evento original y excluye fechas externas", () => {
    const records = [
      { id: "c1", event_date: "2026-09-01", event_name: "Extra", compensated_hours_day: "2026-10-02", t_time_start: "09:00:00", t_time_finish: "10:00:00", compensated_hours: 1, user1: { name: "Sistema" } },
      { id: "c2", event_date: "2026-10-03", event_name: "Extra", compensated_hours_day: "2026-11-02", t_time_start: "09:00:00", t_time_finish: "10:00:00", user1: null },
      { id: "c3", event_date: "2026-11-01", event_name: "Extra", user1: null },
    ];
    const events = buildCalendarEvents([], records, range);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ start: "2026-10-02T09:00:00", end: "2026-10-02T10:00:00", allDay: false });
  });
  it("mantiene eventos de fecha como días completos sin convertirlos a timestamps", () => {
    expect(buildCalendarEvents([], [{ id: "c", event_date: "2026-10-01", event_name: "Extra", user1: null }], range)[0]).toMatchObject({ start: "2026-10-01", allDay: true });
  });
});
