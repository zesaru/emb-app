import { expect, it } from "vitest";
import { vacationDate, vacationToday, vacationMonth, formatVacationDate, isVacationActive } from "@/lib/vacations/dates";

it("cambia de mes a medianoche de Tokio aunque UTC siga en septiembre", () => {
  const now = new Date("2026-09-30T15:00:00Z");
  expect(vacationToday(now)).toBe("2026-10-01");
  expect(vacationMonth(now)).toEqual({ start: "2026-10-01", end: "2026-11-01" });
  expect(vacationToday(new Date("2026-09-30T14:59:59Z"))).toBe("2026-09-30");
});
it("conserva días de calendario y convierte timestamps a Tokio", () => {
  expect(vacationDate("2026-10-01")).toBe("2026-10-01");
  expect(vacationDate("2026-09-30T15:00:00Z")).toBe("2026-10-01");
  expect(formatVacationDate("2026-10-01")).toBe("01/10/2026");
});
it("incluye el día completo de inicio y fin y excluye el día siguiente", () => {
  expect(isVacationActive("2026-10-01", "2026-10-04", new Date("2026-10-04T14:59:59Z"))).toBe(true);
  expect(isVacationActive("2026-10-01", "2026-10-04", new Date("2026-10-04T15:00:00Z"))).toBe(false);
  expect(isVacationActive("2026-10-01", "2026-10-04", new Date("2026-09-30T15:00:00Z"))).toBe(true);
});
it("valida días reales, valores ausentes y febrero bisiesto", () => {
  expect(vacationDate("2026-02-30")).toBeNull();
  expect(vacationDate(null)).toBeNull();
  expect(formatVacationDate(null)).toBe("—");
  expect(vacationMonth(new Date("2024-02-29T03:00:00Z"))).toEqual({ start: "2024-02-01", end: "2024-03-01" });
});
