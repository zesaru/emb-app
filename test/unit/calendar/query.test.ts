import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCalendarEvents } from "@/actions/get-calendar-events";

const mocks = vi.hoisted(() => ({ user: vi.fn(), active: vi.fn(), scoped: vi.fn(), admin: vi.fn(), filters: vi.fn(), ranges: vi.fn() }));
vi.mock("@/lib/auth/request-user", () => ({ getRequestUser: mocks.user }));
vi.mock("@/lib/auth/admin-check", () => ({ requireUserActive: mocks.active }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ from: mocks.scoped }) }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: () => ({ from: mocks.admin }) }));

// Evaluate PostgREST filters so a NULL comparison cannot silently pass the mock.
function splitTerms(value: string) {
  let depth = 0, start = 0;
  const parts: string[] = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "(") depth++;
    if (value[i] === ")") depth--;
    if (value[i] === "," && depth === 0) { parts.push(value.slice(start, i)); start = i + 1; }
  }
  return [...parts, value.slice(start)];
}
function matches(row: Record<string, any>, expression: string): boolean {
  if (expression.startsWith("and(")) return splitTerms(expression.slice(4, -1)).every(term => matches(row, term));
  if (expression.startsWith("or(")) return splitTerms(expression.slice(3, -1)).some(term => matches(row, term));
  const [column, ...parts] = expression.split(".");
  const operator = parts.shift();
  const value = row[column] ?? null;
  if (operator === "not") return !matches(row, `${column}.${parts.join(".")}`);
  const expected = parts.join(".");
  if (operator === "is" && expected === "null") return value === null;
  if (value === null) return false; // SQL comparisons with NULL do not match.
  if (operator === "gte") return value >= (typeof value === "number" ? Number(expected) : expected);
  if (operator === "lt") return value < expected;
  if (operator === "eq") return String(value) === expected;
  throw new Error(`Unsupported test operator: ${operator}`);
}
function query(rows: unknown[], error: unknown = null) {
  let offset = 0;
  const predicates: Array<(row: Record<string, any>) => boolean> = [];
  const q: any = { select: vi.fn(() => q), order: vi.fn(() => q),
    range: (from: number, to: number) => { offset = from; mocks.ranges(from, to); return q; },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: (rows as Record<string, any>[]).filter(row => predicates.every(test => test(row))).slice(offset, offset + 1000), error }).then(resolve) };
  for (const method of ["eq", "gte", "lt", "or", "is"]) q[method] = (...args: unknown[]) => {
    mocks.filters(method, ...args);
    predicates.push(row => matches(row, method === "or" ? `or(${args[0]})` : `${args[0]}.${method}.${args[1]}`));
    return q;
  };
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
  const rows = Array.from({ length: 1001 }, (_, i) => ({ id: String(i), event_date: "2026-10-02", event_name: "Extra", hours: 2, user1: null }));
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

const rest = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id, hours: null, compensated_hours: 2, compensated_hours_day: date,
  t_time_start: "09:00:00", t_time_finish: "11:00:00", cancelled_at: null,
  user1: { name: "Persona de prueba" }, ...extra,
});
it("incluye descansos con hours NULL, con inicio inclusivo y final exclusivo", async () => {
  mocks.admin.mockImplementation(() => query([
    rest("start", "2026-10-01"), rest("last", "2026-10-31"),
    rest("before", "2026-09-30"), rest("after", "2026-11-01"),
    { id: "work", hours: 2, event_date: "2026-10-02", event_name: "Trabajo", user1: null },
  ]));
  const events = await getCalendarEvents(range);
  expect(events.map(event => event.id).sort()).toEqual(["compensatory-last", "compensatory-start", "compensatory-work"]);
  expect(events.find(event => event.id === "compensatory-start")).toMatchObject({ allDay: false, start: "2026-10-01T09:00:00", extendedProps: { compensatedHours: 2 } });
});
it("excluye cancelados y horas inválidas de cada tipo sin confundir sus columnas", async () => {
  mocks.admin.mockImplementation(() => query([
    rest("cancelled", "2026-10-02", { cancelled_at: "2026-10-01T00:00:00Z" }),
    rest("negative", "2026-10-02", { compensated_hours: -1, hours: 3 }),
    rest("missing-hours", "2026-10-02", { compensated_hours: null }),
    rest("valid", "2026-10-02"),
    { id: "work-cancelled", hours: 2, event_date: "2026-10-02", event_name: "Trabajo", cancelled_at: "2026-10-01T00:00:00Z", user1: null },
    { id: "work-negative", hours: -1, event_date: "2026-10-02", event_name: "Trabajo", user1: null },
  ]));
  expect((await getCalendarEvents(range)).map(event => event.id)).toEqual(["compensatory-valid"]);
});
