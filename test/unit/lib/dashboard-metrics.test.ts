import { describe, expect, it } from "vitest";
import { buildDashboardReport, getVacationRecommendation } from "@/lib/reporting/dashboard-metrics";

describe("getVacationRecommendation", () => {
  it("prioriza saldos que vencen dentro de 90 días", () => {
    expect(getVacationRecommendation({
      vacationBalance: 4,
      nextExpiryDate: "2026-10-01",
      now: new Date("2026-09-03T12:00:00Z"),
    })).toBe("urgent");
  });

  it("recomienda planificar el uso para saldos altos sin vencimiento cercano", () => {
    expect(getVacationRecommendation({
      vacationBalance: 15,
      nextExpiryDate: null,
      now: new Date("2026-09-03T12:00:00Z"),
    })).toBe("plan");
  });

  it("mantiene saludable un saldo pequeño sin alerta de vencimiento", () => {
    expect(getVacationRecommendation({
      vacationBalance: 9,
      nextExpiryDate: null,
      now: new Date("2026-09-03T12:00:00Z"),
    })).toBe("healthy");
  });
});

describe("buildDashboardReport", () => {
  it("calcula los indicadores operativos sin contar registros cancelados", () => {
    const report = buildDashboardReport({
      activeEmployees: 4,
      vacationBalance: 18,
      compensatoryHoursAvailable: 8,
      now: new Date("2026-08-24T12:00:00"),
      vacations: [
        { id: "approved-this-month", created_at: "2026-08-01", start: "2026-08-18", finish: "2026-08-22", days: 5, approve_request: true },
        { id: "active", created_at: "2026-08-10", start: "2026-08-23", finish: "2026-08-25", days: 2, approve_request: true },
        { id: "pending", created_at: "2026-08-20", start: "2026-09-01", finish: "2026-09-02", days: 2, approve_request: false },
      ],
      compensatorys: [
        { id: "pending", created_at: "2026-08-01", event_date: "2026-08-01", event_name: "Evento", hours: 4, compensated_hours: null, approve_request: null, final_approve_request: null, cancelled_at: null },
        { id: "rest", created_at: "2026-08-02", event_date: "2026-08-02", event_name: null, hours: null, compensated_hours: 8, approve_request: null, final_approve_request: null, cancelled_at: null },
        { id: "cancelled", created_at: "2026-08-03", event_date: "2026-08-03", event_name: "Cancelada", hours: 4, compensated_hours: null, approve_request: null, final_approve_request: null, cancelled_at: "2026-08-04" },
      ],
    });

    expect(report.overview).toMatchObject({
      activeEmployees: 4,
      vacationBalance: 18,
      pendingVacations: 1,
      activeVacations: 1,
      approvedVacationDaysThisMonth: 7,
      pendingCompensatoryRequests: 1,
      pendingCompensatoryRests: 1,
      compensatoryHoursAvailable: 8,
    });
    expect(report.vacationStatus).toEqual([
      { label: "Aprobadas", value: 2, color: "bg-emerald-500" },
      { label: "Pendientes", value: 1, color: "bg-amber-400" },
      { label: "Activas", value: 1, color: "bg-sky-500" },
    ]);
  });
});
