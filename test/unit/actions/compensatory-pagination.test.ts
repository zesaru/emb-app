import { beforeEach, describe, expect, it, vi } from "vitest";
const user = vi.fn(), active = vi.fn(), admin = vi.fn(), permission = vi.fn(), from = vi.fn();
vi.mock("@/lib/auth/request-user", () => ({ getRequestUser: () => user() }));
vi.mock("@/lib/auth/admin-check", () => ({ requireUserActive: () => active(), isAdmin: () => admin() }));
vi.mock("@/lib/auth/compensatory-permissions", () => ({ canViewAllCompensatorys: () => permission() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ from }) }));
const ranges = vi.fn(), eq = vi.fn(), order = vi.fn(), search = vi.fn();
const gte = vi.fn(), lte = vi.fn();
let total = 26;
let queryError: { message: string } | null = null;
function query() {
  let head = false, range = [0, 24];
  const q: any = { select: (_: string, options: any) => { head = options?.head; return q; }, gte: (...args: unknown[]) => { gte(...args); return q; }, lte: (...args: unknown[]) => { lte(...args); return q; },
    eq: (...args: unknown[]) => { eq(...args); return q; }, or: (...args: unknown[]) => { search(...args); return q; },
    order: (...args: unknown[]) => { order(...args); return q; }, range: (a: number,b: number) => { ranges(a,b); range=[a,b]; return q; },
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ count: total, error: queryError, data: head ? null : Array.from({length:Math.max(0,Math.min(total- range[0],range[1]-range[0]+1))},(_,i)=>({id:String(range[0]+i)})) }).then(resolve) };
  return q;
}
describe("paginación de compensatorios", () => {
  beforeEach(() => { vi.resetAllMocks(); total=26; queryError=null; user.mockResolvedValue({data:{user:{id:"own-id"}},error:null}); active.mockResolvedValue(undefined);admin.mockResolvedValue(false);permission.mockResolvedValue(false);from.mockImplementation(query); });
  it("limita el usuario normal en SQL y carga una sola página", async () => {
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    const result = await listCompensatoryRecords({page:2});
    expect(result.rows).toHaveLength(1);expect(result.total).toBe(26);expect(ranges).toHaveBeenCalledWith(25,25);expect(eq).toHaveBeenCalledWith("user_id","own-id");
  });
  it("ajusta una página fuera de rango y conserva el orden estable", async () => {
    admin.mockResolvedValue(true);
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    expect((await listCompensatoryRecords({page:999,sort:"asc"})).page).toBe(2);
    expect(order).toHaveBeenCalledWith("event_date",{ascending:true});expect(order).toHaveBeenCalledWith("id",{ascending:true});expect(eq).not.toHaveBeenCalled();
  });
  it("view_all concede lectura completa sin ser admin", async () => {
    permission.mockResolvedValue(true);
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    await listCompensatoryRecords();expect(eq).not.toHaveBeenCalled();
  });
  it("el reporte carga también las filas posteriores al primer lote", async () => {
    total=1001;
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    const result=await listCompensatoryRecords({ month: "2026-10" },true);
    expect(result.rows).toHaveLength(1001);expect(ranges).toHaveBeenCalledWith(0,999);expect(ranges).toHaveBeenCalledWith(1000,1000);
  });
  it.each([undefined, "inválido", "2026-13"])("rechaza reportes sin un mes válido: %s", async (month) => {
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    await expect(listCompensatoryRecords({ month }, true)).rejects.toThrow("Selecciona un mes válido para el reporte");
    expect(from).not.toHaveBeenCalled();
  });
  it("incluye el último día de febrero en un año bisiesto", async () => {
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    await listCompensatoryRecords({ month: "2024-02", status: "approved" });
    expect(gte).toHaveBeenCalledWith("event_date", "2024-02-01");
    expect(lte).toHaveBeenCalledWith("event_date", "2024-02-29");
    expect(eq).toHaveBeenCalledWith("approve_request", true);
  });
  it("respeta el rango explícito y filtra al usuario en la relación", async () => {
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    await listCompensatoryRecords({ month: "2024-02", from: "2024-02-10", to: "2024-02-15", user: "sistema", status: "pending" });
    expect(gte).toHaveBeenCalledWith("event_date", "2024-02-10");
    expect(lte).toHaveBeenCalledWith("event_date", "2024-02-15");
    expect(eq).toHaveBeenCalledWith("approve_request", false);
    expect(search).toHaveBeenCalledWith('name.ilike."%sistema%",email.ilike."%sistema%"', { referencedTable: "user1" });
  });
  it("no descarga filas cuando el filtro no tiene resultados", async () => {
    total = 0;
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    const result = await listCompensatoryRecords({ page: -2 });
    expect(result).toEqual({ rows: [], total: 0, page: 1, pages: 1 });
    expect(ranges).not.toHaveBeenCalled();
  });
  it("propaga el fallo de consulta sin presentar una lista vacía", async () => {
    queryError = { message: "permission denied" };
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    await expect(listCompensatoryRecords()).rejects.toThrow("No se pudieron cargar los compensatorios");
    expect(ranges).not.toHaveBeenCalled();
  });
  it("rechaza una sesión inválida antes de consultar datos", async () => {
    user.mockResolvedValue({ data: { user: null }, error: new Error("expired") });
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    await expect(listCompensatoryRecords()).rejects.toThrow("No autenticado");
    expect(active).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });
  it("rechaza una cuenta inactiva antes de consultar registros", async () => {
    active.mockRejectedValue(new Error("Usuario inactivo"));
    const { listCompensatoryRecords } = await import("@/actions/list-compensatory-records");
    await expect(listCompensatoryRecords()).rejects.toThrow("Usuario inactivo");expect(from).not.toHaveBeenCalled();
  });
});
