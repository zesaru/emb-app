import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), history: vi.fn() }));
vi.mock("@/lib/auth/admin-check", () => ({ requireCurrentUserAdminAndActive: mocks.auth }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mocks.from })),
}));
vi.mock("@/actions/admin/vacation-grants/list-user-grants", () => ({
  listUserVacationGrants: mocks.history,
}));
import { getStaffReport, getIndividualStaffReport } from "@/actions/get-staff-report";
const period = { from: "2026-01-01", to: "2026-12-31" };
const id = "86cf7816-6666-4111-8999-123456789abc";
const person = {
  id,
  name: "Persona",
  email: "persona@example.test",
  is_active: true,
  is_diplomatic: false,
  grant_mode: "manual",
  hire_date: null,
  manual_next_grant_date: null,
  position: null,
};
function setup(failTable?: string) {
  const queries: {
    table: string;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    range: ReturnType<typeof vi.fn>;
  }[] = [];
  mocks.from.mockImplementation((table: string) => {
    const q = { table, select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn() };
    q.select.mockReturnValue(q);
    q.eq.mockReturnValue(q);
    q.order.mockReturnValue(q);
    q.range.mockImplementation(async (from: number) => {
      if (table === failTable && from >= 1000)
        return { data: null, error: { message: "read failed" } };
      const row =
        table === "users"
          ? person
          : table === "vacation_grants"
            ? {
                id: "g",
                user_id: id,
                granted_on: "2026-01-01",
                expires_on: "2099-01-01",
                days_granted: 1,
                days_remaining: 1,
                rule_type: "manual",
                notes: null,
              }
            : table === "vacations"
              ? {
                  id: "v",
                  id_user: id,
                  start: "2026-04-01",
                  finish: "2026-04-01",
                  days: 1,
                  approve_request: true,
                  cancelled_at: null,
                  request_date: "2026-03-01",
                }
              : {
                  id: "c",
                  user_id: id,
                  event_name: "Trabajo",
                  hours: 1,
                  approve_request: true,
                  compensated_hours: null,
                  cancelled_at: null,
                };
      // Each complete collection must fetch the final 1001st record.
      return {
        data:
          from === 0
            ? Array.from({ length: 1000 }, (_, i) => ({
                ...row,
                id:
                  table === "users"
                    ? `${id.slice(0, -4)}${String(i).padStart(4, "0")}`
                    : `${table}-${i}`,
              }))
            : from === 1000
              ? [row]
              : [],
        error: null,
      };
    });
    queries.push(q);
    return q;
  });
  return queries;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue(id);
  mocks.history.mockResolvedValue({ success: true, data: [] });
});
describe("lectura administrativa de informes", () => {
  it("exige administrador activo antes de consultar datos", async () => {
    mocks.auth.mockRejectedValue(new Error("No autorizado"));
    await expect(getStaffReport(period)).rejects.toThrow("No autorizado");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("lee todos los lotes con orden estable y calcula el saldo completo", async () => {
    const queries = setup();
    const result = await getStaffReport(period);
    expect(result.employees).toHaveLength(1001);
    const employee = result.employees.find((row) => row.id === id)!;
    expect(employee.balance).toBe(1001);
    expect(employee.approvedDays).toBe(1001);
    expect(employee.compensatoryHours).toBe(1001);
    for (const q of queries) {
      expect(q.order).toHaveBeenCalledWith("id");
    }
    for (const table of ["users", "vacation_grants", "vacations", "compensatorys"]) {
      expect(queries.filter((q) => q.table === table).flatMap((q) => q.range.mock.calls)).toEqual([
        [0, 999],
        [1000, 1999],
      ]);
    }
  });
  it.each(["users", "vacation_grants", "vacations", "compensatorys"])(
    "falla todo el reporte cuando falla el segundo lote de %s",
    async (table) => {
      setup(table);
      await expect(getStaffReport(period)).rejects.toThrow();
    },
  );
  it("aplica el usuario solicitado a todas las colecciones del informe individual", async () => {
    const queries = setup();
    // Only one user in a scoped query; other tables still exercise all batches.
    const original = mocks.from.getMockImplementation()!;
    mocks.from.mockImplementation((table: string) => {
      const q = original(table);
      if (table === "users") q.range.mockResolvedValue({ data: [person], error: null });
      return q;
    });
    const result = await getIndividualStaffReport({ userId: id, period });
    expect(result.vacations).toHaveLength(1001);
    for (const q of queries)
      expect(q.eq).toHaveBeenCalledWith(
        q.table === "users" ? "id" : q.table === "vacations" ? "id_user" : "user_id",
        id,
      );
    expect(mocks.history).toHaveBeenCalledWith({ userId: id });
  });
  it("no entrega un informe parcial si falla el historial de consumos", async () => {
    setup();
    mocks.history.mockResolvedValue({ success: false, error: "Historial incompleto" });
    await expect(getIndividualStaffReport({ userId: id, period })).rejects.toThrow(
      "Historial incompleto",
    );
  });
  it("rechaza fechas e identificadores inválidos", async () => {
    setup();
    await expect(getStaffReport({ from: "2026-02-30", to: "2026-12-31" })).rejects.toThrow();
    await expect(getIndividualStaffReport({ userId: "invalido", period })).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
