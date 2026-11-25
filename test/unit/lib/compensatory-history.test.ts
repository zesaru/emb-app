import { describe, expect, it } from "vitest";
import { buildCompensatoryHistory, type CompensatoryMovement } from "@/lib/compensatorios/history";

function movement(id: string, fields: Partial<CompensatoryMovement> = {}): CompensatoryMovement {
  return {
    id,
    user_id: "employee",
    event_date: "2026-01-01",
    compensated_hours_day: null,
    event_name: "Trabajo adicional",
    hours: 1,
    compensated_hours: null,
    approve_request: true,
    final_approve_request: null,
    cancelled_at: null,
    t_time_start: null,
    ...fields,
  };
}

describe("historial individual de compensatorios", () => {
  it("mantiene el saldo anterior al año y a la página e incluye descansos por su fecha", () => {
    const movements = [
      movement("prior", { event_date: "2025-12-31", hours: 7 }),
      ...Array.from({ length: 25 }, (_, index) => movement(String(index).padStart(2, "0"))),
      movement("rest", {
        event_date: null, compensated_hours_day: "2026-01-02", event_name: null,
        hours: null, compensated_hours: 7, approve_request: null, final_approve_request: true,
      }),
      movement("pending", { event_date: "2026-01-03", hours: 4, approve_request: false }),
      movement("cancelled", { event_date: "2026-01-04", hours: 20, cancelled_at: "2026-01-05" }),
    ].reverse();

    const firstPage = buildCompensatoryHistory(movements, { year: "2026" });
    expect(firstPage.years).toEqual(["2026", "2025"]);
    expect(firstPage.rows[0]).toMatchObject({ id: "00", runningBalance: 8 });
    expect(firstPage.rows).toHaveLength(25);
    expect(firstPage).toMatchObject({ first: 1, last: 25, total: 28, totalEntries: 49, totalExits: 7 });

    const lastPage = buildCompensatoryHistory(movements, { year: "2026", page: "99" });
    expect(lastPage).toMatchObject({ page: 2, pages: 2, first: 26, last: 28, totalEntries: 49, totalExits: 7 });
    expect(lastPage.rows.map(({ id, movementDate, runningBalance }) => [id, movementDate, runningBalance])).toEqual([
      ["rest", "2026-01-02", 25],
      ["pending", "2026-01-03", 25],
      ["cancelled", "2026-01-04", 25],
    ]);
  });

  it("conserva los movimientos sin fecha en Todos los años y muestra vacío un año sin datos", () => {
    const undated = movement("undated", { event_date: null });
    expect(buildCompensatoryHistory([undated], { year: "otro", page: "-1" }))
      .toMatchObject({ total: 1, page: 1, rows: [{ movementDate: null }], years: [] });
    expect(buildCompensatoryHistory([undated], { year: "2025", page: "2" }))
      .toMatchObject({ total: 0, page: 1, first: 0, last: 0, rows: [], year: "2025" });
  });
});
