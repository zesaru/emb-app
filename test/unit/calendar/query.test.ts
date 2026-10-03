import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCalendarEvents } from "@/actions/get-calendar-events";

const mocks = vi.hoisted(() => ({ user: vi.fn(), active: vi.fn(), scoped: vi.fn(), admin: vi.fn(), filters: vi.fn(), ranges: vi.fn() }));
vi.mock("@/lib/auth/request-user", () => ({ getRequestUser: mocks.user }));
vi.mock("@/lib/auth/admin-check", () => ({ requireUserActive: mocks.active }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ from: mocks.scoped }) }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: () => ({ from: mocks.admin }) }));

function query(rows: unknown[], error: unknown = null) {
  let offset = 0;
  const q: any = { select: vi.fn(() => q), order: vi.fn(() => q),
    range: (from: number, to: number) => { offset = from; mocks.ranges(from, to); return q; },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows.slice(offset, offset + 1000), error }).then(resolve) };
  for (const method of ["eq", "gte", "lt", "or"]) q[method] = (...args: unknown[]) => { mocks.filters(method, ...args); return q; };
  return q;
}
const range = { start: "2026-10-01", end: "2026-11-01" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ data: { user: { id: "normal-user" } }, error: null });
  mocks.active.mockResolvedValue(undefined);
  mocks.scoped.mockImplementation(() => query([]));
  mocks.admin.mockImplementation(() => query([]));
});

it("aplica solapamiento en Tokio y limita ambos tipos de fecha de compensatorio", async () => {
  await getCalendarEvents(range);
  expect(mocks.active).toHaveBeenCalledWith("normal-user");
  expect(mocks.filters).toHaveBeenCalledWith("lt", "start", "2026-11-01T00:00:00+09:00");
  expect(mocks.filters).toHaveBeenCalledWith("gte", "finish", "2026-10-01T00:00:00+09:00");
  expect(mocks.filters).toHaveBeenCalledWith("eq", "user1.is_active", true);
  expect(mocks.filters).toHaveBeenCalledWith("eq", "user1.is_diplomatic", false);
  expect(mocks.filters).toHaveBeenCalledWith("or", "and(compensated_hours_day.gte.2026-10-01,compensated_hours_day.lt.2026-11-01),and(event_date.gte.2026-10-01,event_date.lt.2026-11-01)");
  expect(mocks.scoped).toHaveBeenCalledWith("vacations");
  expect(mocks.admin).toHaveBeenCalledWith("compensatorys");
});
it("carga los lotes siguientes sin recortar el periodo a 1000 filas", async () => {
  const rows = Array.from({ length: 1001 }, (_, i) => ({ id: String(i), event_date: "2026-10-02", event_name: "Extra", user1: null }));
  mocks.admin.mockImplementation(() => query(rows));
  expect(await getCalendarEvents(range)).toHaveLength(1001);
  expect(mocks.ranges).toHaveBeenCalledWith(1000, 1999);
});
it("rechaza una sesión inválida antes de acceder a la consulta privilegiada", async () => {
  mocks.user.mockResolvedValue({ data: { user: null }, error: null });
  await expect(getCalendarEvents(range)).rejects.toMatchObject({ status: 401 });
  expect(mocks.admin).not.toHaveBeenCalled();
  expect(mocks.scoped).not.toHaveBeenCalled();
});
it("rechaza una cuenta inactiva antes de consultar", async () => {
  mocks.active.mockRejectedValue(new Error("Usuario inactivo"));
  await expect(getCalendarEvents(range)).rejects.toMatchObject({ status: 403 });
  expect(mocks.admin).not.toHaveBeenCalled();
});
it("distingue un fallo de consulta de un calendario vacío", async () => {
  mocks.scoped.mockImplementation(() => query([], { message: "permission denied" }));
  await expect(getCalendarEvents(range)).rejects.toThrow("No se pudieron cargar las vacaciones del calendario");
});

it("propaga un fallo de verificación de perfil sin convertirlo en cuenta inactiva", async () => {
  mocks.active.mockRejectedValue(new Error("Error verificando estado del usuario"));
  await expect(getCalendarEvents(range)).rejects.toThrow("Error verificando estado del usuario");
  expect(mocks.admin).not.toHaveBeenCalled();
});
