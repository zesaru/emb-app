import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminContext } = vi.hoisted(() => ({ requireAdminContext: vi.fn() }));
vi.mock("@/actions/admin/users/shared", () => ({ requireAdminContext }));

import listAdminUsers from "@/actions/admin/users/list-users";

const user = (id: string, extra = {}) => ({
  id, email: `${id}@example.test`, name: id, is_active: true, role: "user", ...extra,
});
const grant = (extra = {}) => ({
  id: "grant-1", user_id: "one", granted_on: "2026-04-01", rule_type: "standard",
  notes: null, days_remaining: 1, expires_on: "2026-10-01", ...extra,
});

function setup(users = [user("one")], grants = [grant()], failedOffset?: number) {
  const result = (offset = 0, end = offset + 999) => offset === failedOffset
    ? { data: null, error: { message: "private database error" } }
    : { data: grants.slice(offset, end + 1), error: null };
  const query = {
    select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), range: vi.fn(async (start, end) => result(start, end)),
    then: (resolve: (value: ReturnType<typeof result>) => unknown) => Promise.resolve(result()).then(resolve),
  };
  const from = vi.fn((table: string) => table === "users"
    ? { select: () => ({ order: async () => ({ data: users, error: null }) }) }
    : query);
  requireAdminContext.mockResolvedValue({ supabase: { from }, adminUserId: "admin" });
  return { query, from };
}

describe("Saldos de vacaciones en Administración de Usuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T16:00:00Z")); // 2 de octubre en Tokio.
  });
  afterEach(() => vi.useRealTimers());

  it("excluye una concesión vencida en Tokio aunque UTC siga en el día anterior", async () => {
    setup();
    const result = await listAdminUsers();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].vacationBalance).toBe(0);
      expect(result.data[0].nextVacationExpirationDate).toBeNull();
    }
  });

  it("incluye el último día de vigencia en Tokio y conserva la próxima fecha manual", async () => {
    setup([user("one", { grant_mode: "manual", manual_next_grant_date: "2027-04-01" })],
      [grant({ expires_on: "2026-10-02" })]);
    const result = await listAdminUsers();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].vacationBalance).toBe(1);
      expect(result.data[0].nextExpectedGrantDate).toBe("2027-04-01");
    }
  });

  it("consulta las concesiones solo de los usuarios que cumplen búsqueda, estado y rol", async () => {
    const { query } = setup([
      user("one", { position: "Sistemas", role: "user", admin: "admin" }),
      user("two", { position: "Sistemas", is_active: false, admin: "admin" }),
      user("three", { position: "Sistemas" }), user("four", { admin: "admin" }),
    ]);
    const result = await listAdminUsers({ search: "SISTEMAS", status: "active", role: "admin" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.map((row) => row.id)).toEqual(["one"]);
    expect(query.in).toHaveBeenCalledWith("user_id", ["one"]);
  });

  it("evita consultar concesiones cuando los filtros no encuentran usuarios", async () => {
    const { from } = setup();
    expect(await listAdminUsers({ search: "sin coincidencias" })).toEqual({ success: true, data: [] });
    expect(from).not.toHaveBeenCalledWith("vacation_grants");
  });

  it("suma las 1001 concesiones sin truncar el saldo al límite de la API", async () => {
    const { query } = setup([user("one")], Array.from({ length: 1001 }, (_, i) =>
      grant({ id: `grant-${i}`, expires_on: "2028-04-01" })));
    const result = await listAdminUsers();
    expect(result.success).toBe(true);
    if (result.success) expect(result.data[0].vacationBalance).toBe(1001);
    expect(query.range).toHaveBeenCalledWith(1000, 1999);
    expect(query.order).toHaveBeenCalledWith("id", { ascending: false });
  });

  it.each([0, 1000])("un fallo en el lote %i no se presenta como saldo cero ni parcial", async (offset) => {
    setup([user("one")], Array.from({ length: 1001 }, () => grant()), offset);
    expect(await listAdminUsers()).toEqual({ success: false, error: "No se pudieron obtener los saldos de vacaciones" });
  });

  it("desglosa 25 + 20 por vencimiento sin limitar a 40 ni incluir bolsas futuras", async () => {
    setup([user("one", { grant_mode: "manual" })], [
      grant({ rule_type: "manual", days_remaining: 25, expires_on: "2027-09-01", notes: "Caso especial autorizado: más de 40 días" }),
      grant({ id: "new", granted_on: "2026-09-01", days_remaining: 20, expires_on: "2028-09-01" }),
      grant({ id: "future", granted_on: "2027-09-01", days_remaining: 20, expires_on: "2029-09-01" }),
    ]);
    const result = await listAdminUsers();
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data[0].vacationBalance).toBe(45);
    expect(result.data[0].vacationExpirations).toEqual([
      { date: "2027-09-01", days: 25 }, { date: "2028-09-01", days: 20 },
    ]);
    expect(result.data[0].vacationSpecialNotes).toEqual(["Caso especial autorizado: más de 40 días"]);
  });

  it("agrupa bolsas que vencen el mismo día y no infiere una excepción del saldo", async () => {
    setup([user("one")], [grant({ days_remaining: 30, expires_on: "2027-09-01" }), grant({ days_remaining: 20, expires_on: "2027-09-01" })]);
    const result = await listAdminUsers();
    if (!result.success) throw new Error("Expected success");
    expect(result.data[0].vacationExpirations).toEqual([{ date: "2027-09-01", days: 50 }]);
    expect(result.data[0].vacationSpecialNotes).toEqual([]);
  });

  it("no consulta datos si falla la autorización administrativa", async () => {
    const { from } = setup();
    requireAdminContext.mockRejectedValue(new Error("No autorizado"));
    expect((await listAdminUsers()).success).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });
});
