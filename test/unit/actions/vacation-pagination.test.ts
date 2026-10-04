import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), active: vi.fn(), admin: vi.fn(), from: vi.fn(), calls: [] as { select: string; options: any; filters: [string, ...unknown[]][]; range?: number[] }[] }));
vi.mock("@/lib/auth/request-user", () => ({ getRequestUser: mocks.user }));
vi.mock("@/lib/auth/admin-check", () => ({ requireUserActive: mocks.active, isAdmin: mocks.admin }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ from: mocks.from }) }));
import { listVacationRecords } from "@/actions/list-vacation-records";
let fail: "count" | "rows" | "summary" | undefined;
let total = 26;
beforeEach(() => {
  vi.resetAllMocks(); mocks.calls.length = 0; fail = undefined; total = 26;
  mocks.user.mockResolvedValue({ data: { user: { id: "own" } }, error: null });
  mocks.active.mockResolvedValue(undefined); mocks.admin.mockResolvedValue(false);
  mocks.from.mockImplementation(() => {
    const call = { select: "", options: {} as any, filters: [] as [string, ...unknown[]][], range: undefined as number[] | undefined };
    mocks.calls.push(call);
    const q: any = { select: (value: string, options: any) => { call.select = value; call.options = options; return q; },
      range: (a: number, b: number) => { call.range = [a,b]; return q; },
      then: (resolve: (result: unknown) => unknown) => {
        const summary = call.select.startsWith("days,");
        const kind = call.options?.head ? "count" : summary ? "summary" : "rows";
        const length = Math.max(0, Math.min(total - (call.range?.[0] ?? 0), (call.range?.[1] ?? 24) - (call.range?.[0] ?? 0) + 1));
        return Promise.resolve({ error: fail === kind ? { message: "internal DB error" } : null, count: total,
          data: call.options?.head ? null : Array.from({ length }, (_,i) => ({ id: String(i), days: 2 })) }).then(resolve);
      },
    };
    for (const method of ["eq", "gte", "lte", "lt", "or", "order"]) q[method] = (...args: unknown[]) => { call.filters.push([method, ...args]); return q; };
    return q;
  });
});
it("limita usuarios normales en cada consulta y descarga solo una página", async () => {
  const result = await listVacationRecords({ page: 2 }, new Date("2026-09-30T15:00:00Z"));
  expect(result.rows).toHaveLength(1); expect(result.total).toBe(26);
  expect(mocks.calls.every((q) => q.filters.some((f) => f[0] === "eq" && f[1] === "id_user" && f[2] === "own"))).toBe(true);
  expect(mocks.calls.find((q) => q.select.startsWith("id,id_user,"))?.range).toEqual([25,25]);
  expect(result.summary.approvedDays).toBe(52);
});
it("calcula indicadores completos con el mes de Tokio y fin inclusivo", async () => {
  await listVacationRecords({}, new Date("2026-09-30T15:00:00Z"));
  const summary = mocks.calls.find((q) => q.select.startsWith("days,"))!;
  expect(summary.filters).toContainEqual(["gte", "start", "2026-10-01"]);
  expect(summary.filters).toContainEqual(["lt", "start", "2026-11-01"]);
  const active = mocks.calls.find((q) => q.filters.some((f) => f[0] === "lte" && f[1] === "start"))!;
  expect(active.filters).toContainEqual(["lte", "start", "2026-10-01"]);
  expect(active.filters).toContainEqual(["gte", "finish", "2026-10-01"]);
});
it("permite a admin todas las filas elegibles con orden estable y página acotada", async () => {
  mocks.admin.mockResolvedValue(true);
  expect((await listVacationRecords({ page: 999 })).page).toBe(2);
  expect(mocks.calls.every((q) => !q.filters.some((f) => f[1] === "id_user"))).toBe(true);
  const rows = mocks.calls.find((q) => q.select.startsWith("id,id_user,"))!;
  expect(rows.filters).toContainEqual(["order", "request_date", { ascending: false, nullsFirst: false }]);
  expect(rows.filters).toContainEqual(["order", "id", { ascending: false }]);
  expect(rows.filters).toContainEqual(["eq", "user1.is_active", true]);
  expect(rows.filters).toContainEqual(["eq", "user1.is_diplomatic", false]);
});
it("aplica filtros de nombre, estado y periodo antes de contar o paginar", async () => {
  await listVacationRecords({ user: "Akiko", status: "pending", from: "2026-10-01", to: "2026-10-31" });
  for (const q of mocks.calls) {
    expect(q.filters).toContainEqual(["or", "approve_request.eq.false,approve_request.is.null"]);
    expect(q.filters).toContainEqual(["gte", "start", "2026-10-01"]);
    expect(q.filters).toContainEqual(["lte", "start", "2026-10-31"]);
    expect(q.filters).toContainEqual(["or", 'name.ilike."%Akiko%",email.ilike."%Akiko%"', { referencedTable: "user1" }]);
  }
});
it("no trunca los días aprobados al superar 1000 registros", async () => {
  total = 1001;
  const result = await listVacationRecords();
  expect(result.rows).toHaveLength(25); expect(result.summary.approvedDays).toBe(2002);
  expect(mocks.calls.filter((q) => q.select.startsWith("days,")).map((q) => q.range)).toEqual([[0,999],[1000,1999]]);
});
it.each(["count", "rows", "summary"] as const)("propaga fallos de %s sin convertirlos en un resultado vacío", async (kind) => {
  fail = kind; await expect(listVacationRecords()).rejects.toThrow("No se pudieron cargar las vacaciones");
});
it("distingue un filtro sin resultados de un fallo", async () => {
  total = 0; const result = await listVacationRecords({ page: -1 });
  expect(result.rows).toEqual([]); expect(result.page).toBe(1); expect(result.pages).toBe(1);
});
it.each([{ from: "2026-02-30" }, { from: "2026-10-31", to: "2026-10-01" }])("rechaza fechas inválidas antes de consultar", async (filters) => {
  await expect(listVacationRecords(filters)).rejects.toThrow("Periodo no válido");
  expect(mocks.from).not.toHaveBeenCalled();
});
it("rechaza sesiones inválidas y usuarios inactivos", async () => {
  mocks.user.mockResolvedValue({ data: { user: null }, error: null });
  await expect(listVacationRecords()).rejects.toThrow("No autenticado");
  mocks.user.mockResolvedValue({ data: { user: { id: "own" } }, error: null });
  mocks.active.mockRejectedValue(new Error("Usuario inactivo"));
  await expect(listVacationRecords()).rejects.toThrow("Usuario inactivo");
  expect(mocks.from).not.toHaveBeenCalled();
});
