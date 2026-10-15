import { describe, expect, it } from "vitest";
import {
  availableGrantBuckets,
  buildStaffReport,
  defaultReportPeriod,
  isExpiringSoon,
  validateReportPeriod,
  vacationInPeriod,
  vacationReportStatus,
} from "@/lib/reporting/staff-report";
import type { ReportGrant, ReportUser, ReportVacation } from "@/lib/reporting/staff-report";
const user: ReportUser = {
  id: "u",
  name: "Persona",
  email: "persona@example.test",
  position: null,
  is_active: true,
  is_diplomatic: false,
  hire_date: "2013-03-06",
  grant_mode: "manual",
  manual_next_grant_date: "2026-08-31",
};
const grant = (days: number, expires: string, start = "2026-09-01"): ReportGrant => ({
  id: expires,
  user_id: "u",
  granted_on: start,
  expires_on: expires,
  days_granted: days,
  days_remaining: days,
  rule_type: "manual",
  notes: "Caso especial autorizado",
});
const vacation = (changes: Partial<ReportVacation> = {}): ReportVacation => ({
  id: "v",
  id_user: "u",
  start: "2026-10-15",
  finish: "2026-10-16",
  days: 2,
  approve_request: true,
  cancelled_at: null,
  request_date: "2026-10-01",
  ...changes,
});
const period = { from: "2026-01-01", to: "2026-12-31" };
describe("informes de colaboradores", () => {
  it("mantiene 25+20 con vencimientos distintos y reconoce solamente la excepción documentada", () => {
    const report = buildStaffReport({
      users: [user],
      grants: [grant(25, "2027-09-01"), grant(20, "2028-09-01")],
      vacations: [],
      compensatory: [],
      period,
      now: new Date("2026-10-15T15:01:00Z"),
    });
    expect(report.today).toBe("2026-10-16");
    expect(report.employees[0]).toMatchObject({
      balance: 45,
      special: true,
      nextGrantDate: "2026-08-31",
      expirations: [
        { date: "2027-09-01", days: 25 },
        { date: "2028-09-01", days: 20 },
      ],
    });
    expect(
      buildStaffReport({
        users: [user],
        grants: [{ ...grant(45, "2028-09-01"), notes: null }],
        vacations: [],
        compensatory: [],
        period,
      }).employees[0].special,
    ).toBe(false);
  });
  it("incluye hoy, excluye futuras, vencidas y agotadas y agrupa el mismo vencimiento", () => {
    expect(
      availableGrantBuckets(
        [
          grant(19, "2026-10-15"),
          grant(2, "2026-10-15"),
          grant(20, "2028-10-01", "2026-10-16"),
          grant(5, "2026-10-14"),
          grant(0, "2026-10-15"),
        ],
        "2026-10-15",
      ),
    ).toEqual([{ date: "2026-10-15", days: 21 }]);
  });
  it("no suma canceladas y distingue pendientes false/null de aprobadas", () => {
    const result = buildStaffReport({
      users: [user],
      grants: [],
      vacations: [
        vacation(),
        vacation({ id: "p", approve_request: null }),
        vacation({ id: "p2", approve_request: false }),
        vacation({ id: "c", cancelled_at: "2026-10-15T00:00:00Z" }),
        vacation({ id: "neg", days: -10 }),
        vacation({ id: "old", start: "2025-01-01", finish: "2025-01-02" }),
      ],
      compensatory: [],
      period,
      now: new Date("2026-10-15T00:00:00Z"),
    });
    expect(result.employees[0]).toMatchObject({
      approvedDays: 2,
      approvedRequests: 1,
      pendingRequests: 2,
      activeToday: true,
    });
  });
  it("incluye períodos solapados y no altera los días originales de la solicitud", () => {
    expect(vacationInPeriod(vacation({ start: "2025-12-28", finish: "2026-01-04" }), period)).toBe(
      true,
    );
    expect(vacationInPeriod(vacation({ start: "2027-01-01", finish: "2027-01-02" }), period)).toBe(
      false,
    );
    expect(vacationInPeriod(vacation({ start: null, finish: null }), period)).toBe(true);
  });
  it("conserva el último día en curso y distingue disfrute, programación y cancelación", () => {
    expect(vacationReportStatus(vacation(), "2026-10-16")).toBe("En curso");
    expect(vacationReportStatus(vacation(), "2026-10-17")).toBe("Disfrutada");
    expect(vacationReportStatus(vacation(), "2026-10-14")).toBe("Programada");
    expect(vacationReportStatus(vacation({ cancelled_at: "2026-10-01" }), "2026-10-16")).toBe(
      "Cancelada",
    );
  });
  it("usa 90 días inclusivos y el año de Tokio en el cambio de año", () => {
    expect(defaultReportPeriod(new Date("2026-12-31T15:01:00Z"))).toEqual({
      from: "2027-01-01",
      to: "2027-12-31",
    });
    expect(isExpiringSoon("2026-10-15", "2026-10-15")).toBe(true);
    expect(isExpiringSoon("2027-01-13", "2026-10-15")).toBe(true);
    expect(isExpiringSoon("2027-01-14", "2026-10-15")).toBe(false);
    expect(isExpiringSoon("2026-10-14", "2026-10-15")).toBe(false);
    expect(() => validateReportPeriod({ from: "2026-02-30", to: "2026-12-31" })).toThrow();
    expect(() => validateReportPeriod({ from: "2027-01-01", to: "2026-12-31" })).toThrow();
  });
  it("incluye diplomáticos e inactivos sin atribuir vacaciones a los diplomáticos", () => {
    const result = buildStaffReport({
      users: [{ ...user, is_diplomatic: true, is_active: false }],
      grants: [grant(25, "2027-09-01")],
      vacations: [],
      compensatory: [],
      period,
    });
    expect(result.employees[0]).toMatchObject({
      diplomatic: true,
      active: false,
      balance: 0,
      expirations: [],
      nextGrantDate: null,
    });
  });
  it("descuenta descansos reservados, excluye cancelaciones y no oculta saldos negativos", () => {
    const base = {
      id: "c",
      user_id: "u",
      event_name: null,
      hours: null,
      compensated_hours: 12,
      approve_request: null,
      cancelled_at: null,
    };
    const result = buildStaffReport({
      users: [user],
      grants: [],
      vacations: [],
      compensatory: [
        base,
        {
          ...base,
          id: "w",
          event_name: "Trabajo",
          hours: 8,
          compensated_hours: null,
          approve_request: true,
        },
        { ...base, id: "cancel", compensated_hours: 100, cancelled_at: "2026-10-01" },
      ],
      period,
    });
    expect(result.employees[0]).toMatchObject({
      compensatoryHours: -4,
      compensatoryReservedHours: 12,
    });
  });
});
