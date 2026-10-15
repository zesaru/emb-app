import { afterEach, describe, expect, it, vi } from "vitest";

import { planAutomaticVacationGrants, runAutomaticVacationGrants } from "@/lib/vacations/automatic-grants";
import { getJapanNextGrantDate, resolveJapanDueGrantDate } from "@/lib/vacations/japan-vacation-grants";

type User = Parameters<typeof planAutomaticVacationGrants>[0];
type Grant = Parameters<typeof planAutomaticVacationGrants>[1][number];

const user = (overrides: Partial<User> = {}): User => ({
  id: "employee", hire_date: "2024-04-01", is_active: true, is_diplomatic: false,
  weekly_days: 5, weekly_hours: 40, attendance_eligible: null,
  grant_mode: "automatic", num_vacations: 0, ...overrides,
});
const grant = (date: string, rule = "standard", id = "employee"): Grant => ({
  user_id: id, granted_on: date, rule_type: rule,
});

function memoryClient(users: User[], history: Grant[] = []) {
  const reads: Array<{ table: string; offset: number; end: number }> = [];
  const errors = new Map<string, string>();
  const insert = vi.fn(async (draft: Grant) => {
    if (errors.has(draft.granted_on)) return { error: { code: errors.get(draft.granted_on) } };
    if (history.some(g => g.user_id === draft.user_id && g.granted_on === draft.granted_on)) return { error: { code: "23505" } };
    history.push(draft);
    return { error: null };
  });
  const failPages = new Set<string>();
  const orders: unknown[][] = [];
  const filters: unknown[][] = [];
  const client = {
    from: vi.fn((table: string) => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn((...args: unknown[]) => { filters.push(args); return builder; }),
        order: vi.fn((...args: unknown[]) => { orders.push(args); return builder; }),
        range: vi.fn(async (offset: number, end: number) => {
          reads.push({ table, offset, end });
          if (failPages.has(`${table}:${offset}`)) return { data: null, error: { code: "unavailable" } };
          return { data: (table === "users" ? users : history).slice(offset, end + 1), error: null };
        }),
        insert,
      };
      return builder;
    }),
  };
  return { client: client as unknown as Parameters<typeof runAutomaticVacationGrants>[0], insert, reads, failPages, errors, orders, filters };
}

afterEach(() => vi.useRealTimers());

describe("planAutomaticVacationGrants", () => {
  it("calcula cada aniversario por antigüedad con vencimiento propio a dos años", () => {
    const plan = planAutomaticVacationGrants(user(), [grant("2026-04-01", "manual"), grant("2026-10-01")], "2027-10-01");
    expect(plan).toMatchObject({ status: "ready", grants: [{ granted_on: "2027-10-01", days_granted: 14, expires_on: "2029-10-01" }] });
    const october = planAutomaticVacationGrants(user(), [grant("2025-10-01")], "2026-10-01");
    expect(october).toMatchObject({ status: "ready", grants: [{ days_granted: 12, days_remaining: 12, expires_on: "2028-10-01" }] });
  });

  it("mantiene los 20 días del tramo máximo sin rehacer el saldo manual", () => {
    const history = [grant("2026-04-01", "manual"), grant("2026-10-01")];
    const snapshot = structuredClone(history);
    expect(planAutomaticVacationGrants(user({ hire_date: "2013-04-01" }), history, "2027-10-01"))
      .toMatchObject({ status: "ready", grants: [{ days_granted: 20, expires_on: "2029-10-01" }] });
    expect(history).toEqual(snapshot);
  });

  it("recupera aniversarios omitidos en orden a partir del último otorgamiento", () => {
    const plan = planAutomaticVacationGrants(user(), [grant("2024-10-01")], "2026-10-15");
    expect(plan).toMatchObject({ status: "ready", grants: [
      { granted_on: "2025-10-01", days_granted: 11, expires_on: "2027-10-01" },
      { granted_on: "2026-10-01", days_granted: 12, expires_on: "2028-10-01" },
    ] });
  });

  it("no emite antes del primer derecho y sí lo hace exactamente a los seis meses", () => {
    expect(planAutomaticVacationGrants(user(), [], "2024-09-30")).toMatchObject({ status: "skipped" });
    expect(planAutomaticVacationGrants(user(), [], "2024-10-01")).toMatchObject({ status: "ready", grants: [{ days_granted: 10 }] });
  });

  it.each([
    [{ grant_mode: "manual" }, "skipped", "manual_mode"],
    [{ is_active: false }, "skipped", "excluded_user"],
    [{ is_diplomatic: true }, "skipped", "excluded_user"],
    [{ attendance_eligible: false }, "blocked", "attendance_ineligible"],
    [{ hire_date: null }, "blocked", "invalid_date"],
    [{ hire_date: "2024-02-30" }, "blocked", "invalid_date"],
    [{ weekly_days: null, weekly_hours: null }, "blocked", "invalid_schedule"],
  ] as const)("respeta exclusiones y datos incompletos: %j", (overrides, status, reason) => {
    expect(planAutomaticVacationGrants(user(overrides), [], "2024-10-01")).toEqual({ status, reason });
  });

  it("respeta la jornada proporcional y documenta la asistencia pendiente", () => {
    expect(planAutomaticVacationGrants(user({ weekly_days: 3, weekly_hours: 24 }), [], "2024-10-01"))
      .toMatchObject({ status: "ready", grants: [{ days_granted: 5, rule_type: "proportional", notes: expect.stringContaining("revisión pendiente") }] });
  });

  it("bloquea cortes sin conciliar y saldos legacy sin historial", () => {
    expect(planAutomaticVacationGrants(user(), [grant("2026-04-01", "manual")], "2026-10-01"))
      .toEqual({ status: "blocked", reason: "reconciliation_required" });
    expect(planAutomaticVacationGrants(user({ num_vacations: 9 }), [], "2026-10-01"))
      .toEqual({ status: "blocked", reason: "reconciliation_required" });
    expect(planAutomaticVacationGrants(user(), [grant("2025-10-01"), grant("2026-04-01", "manual")], "2026-10-01"))
      .toEqual({ status: "blocked", reason: "reconciliation_required" });
  });

  it("no reconstruye por inferencia derechos omitidos que ya vencieron", () => {
    expect(planAutomaticVacationGrants(user(), [], "2026-10-02")).toEqual({ status: "blocked", reason: "historical_gap" });
  });

  it.each(["2027-10-01", "2026-09-01"])("bloquea un historial futuro o desalineado: %s", date => {
    expect(planAutomaticVacationGrants(user(), [grant(date)], "2026-10-01"))
      .toEqual({ status: "blocked", reason: "invalid_history" });
  });

  it("recupera el 29 de febrero en años bisiestos sin desplazar el aniversario", () => {
    expect(getJapanNextGrantDate("2023-08-31", "2027-02-28")).toBe("2028-02-29");
    expect(resolveJapanDueGrantDate("2023-08-31", "2028-02-28")).toBe("2027-02-28");
    expect(resolveJapanDueGrantDate("2023-08-31", "2028-02-29")).toBe("2028-02-29");
  });
});

describe("runAutomaticVacationGrants", () => {
  it("usa Tokio al cambiar el día y funciona cualquier semana y día", async () => {
    const db = memoryClient([user()], [grant("2025-10-01")]);
    const before = await runAutomaticVacationGrants(db.client, { now: new Date("2026-09-30T14:59:59Z") });
    expect(before.issued).toBe(0);
    const result = await runAutomaticVacationGrants(db.client, { now: new Date("2026-09-30T15:00:00Z") });
    expect(result).toMatchObject({ success: true, processedAt: "2026-10-01", issued: 1 });
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ days_granted: 12, granted_on: "2026-10-01", expires_on: "2028-10-01" }));
  });

  it("repetir la ejecución no añade días ni actualiza saldos históricos", async () => {
    const db = memoryClient([user()], [grant("2025-10-01")]);
    const options = { now: new Date("2026-10-15T00:00:00Z") };
    expect((await runAutomaticVacationGrants(db.client, options)).issued).toBe(1);
    expect((await runAutomaticVacationGrants(db.client, options)).issued).toBe(0);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it("dry-run calcula la cola sin escribir", async () => {
    const db = memoryClient([user()], [grant("2025-10-01")]);
    expect(await runAutomaticVacationGrants(db.client, { now: new Date("2026-10-15T00:00:00Z"), dryRun: true }))
      .toMatchObject({ dryRun: true, issued: 0, wouldIssue: 1 });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("tolera el duplicado concurrente protegido por el índice único", async () => {
    const db = memoryClient([user()], [grant("2025-10-01")]);
    db.errors.set("2026-10-01", "23505");
    expect(await runAutomaticVacationGrants(db.client, { now: new Date("2026-10-15T00:00:00Z") }))
      .toMatchObject({ success: true, issued: 0, duplicates: 1, failed: 0 });
  });

  it("reporta fallos de escritura y detiene la secuencia de ese usuario para el reintento", async () => {
    const db = memoryClient([user()], [grant("2024-10-01")]);
    db.errors.set("2025-10-01", "42501");
    expect(await runAutomaticVacationGrants(db.client, { now: new Date("2026-10-15T00:00:00Z") }))
      .toMatchObject({ success: false, issued: 0, failed: 1 });
    expect(db.insert).toHaveBeenCalledTimes(1);
    db.errors.clear();
    expect((await runAutomaticVacationGrants(db.client, { now: new Date("2026-10-15T00:00:00Z") })).issued).toBe(2);
  });

  it("lee todas las páginas con orden estable y filtros de elegibilidad", async () => {
    const people = Array.from({ length: 500 }, (_, i) => user({ id: `manual-${i}`, grant_mode: "manual" }));
    const records = Array.from({ length: 500 }, () => grant("2026-04-01", "manual", "other"));
    const db = memoryClient([...people, user()], [...records, grant("2025-10-01")]);
    expect((await runAutomaticVacationGrants(db.client, { now: new Date("2026-10-15T00:00:00Z") })).issued).toBe(1);
    expect(db.reads).toEqual([
      { table: "users", offset: 0, end: 499 }, { table: "users", offset: 500, end: 999 },
      { table: "vacation_grants", offset: 0, end: 499 }, { table: "vacation_grants", offset: 500, end: 999 },
    ]);
    expect(db.orders.every(order => JSON.stringify(order) === JSON.stringify(["id", { ascending: true }]))).toBe(true);
    expect(db.filters).toContainEqual(["is_active", true]);
    expect(db.filters).toContainEqual(["is_diplomatic", false]);
  });

  it.each(["users", "vacation_grants"])("no escribe si falla una segunda página de %s", async table => {
    const people = Array.from({ length: 500 }, (_, i) => user({ id: `employee-${i}` }));
    const db = memoryClient(people, Array.from({ length: 500 }, () => grant("2025-10-01")));
    db.failPages.add(`${table}:500`);
    await expect(runAutomaticVacationGrants(db.client)).rejects.toThrow();
    expect(db.insert).not.toHaveBeenCalled();
  });
});
