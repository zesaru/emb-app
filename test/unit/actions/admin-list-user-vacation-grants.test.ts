import { beforeEach, describe, expect, it, vi } from "vitest";
const requireAdminContextMock = vi.hoisted(() => vi.fn());
vi.mock("@/actions/admin/users/shared", () => ({ requireAdminContext: requireAdminContextMock }));
import listUserVacationGrants from "@/actions/admin/vacation-grants/list-user-grants";
const userId = "123e4567-e89b-12d3-a456-426614174000";
function setup(count = 2, failedOffset?: number, consumptionError = false) {
  const data = Array.from({ length: count }, (_, i) => ({
    id: `grant-${i}`,
    granted_on: "2026-09-01",
  }));
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn(async (offset: number, end: number) =>
      offset === failedOffset
        ? { data: null, error: { message: "private error" } }
        : { data: data.slice(offset, end + 1), error: null },
    ),
  };
  const from = vi.fn((table: string) =>
    table === "vacation_grants"
      ? query
      : {
          ...query,
          range: vi.fn(async () =>
            consumptionError
              ? { data: null, error: { message: "private consumption error" } }
              : {
                  data: [
                    {
                      id: "consumption",
                      grant_id: "grant-0",
                      days_used: 7,
                      consumed_at: "2026-09-01T15:01:00Z",
                    },
                  ],
                  error: null,
                },
          ),
        },
  );
  requireAdminContextMock.mockResolvedValue({ adminUserId: "admin", supabase: { from } });
  return { from, query };
}
describe("historial de asignaciones administrativas", () => {
  beforeEach(() => vi.clearAllMocks());
  it("restringe el historial al usuario solicitado y usa orden estable", async () => {
    const { query } = setup();
    const result = await listUserVacationGrants({ userId });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].consumptions).toEqual([
        { id: "consumption", days_used: 7, consumed_at: "2026-09-01T15:01:00Z" },
      ]);
      expect(result.data[1].consumptions).toEqual([]);
    }
    expect(query.eq).toHaveBeenCalledWith("user_id", userId);
    expect(query.order).toHaveBeenCalledWith("id", { ascending: false });
  });
  it("obtiene las 1001 bolsas sin truncar el historial", async () => {
    const { query } = setup(1001);
    const result = await listUserVacationGrants({ userId });
    if (!result.success) throw new Error("Expected success");
    expect(result.data).toHaveLength(1001);
    expect(query.range).toHaveBeenCalledWith(1000, 1999);
  });
  it.each([0, 1000])("un fallo en el lote %i se propaga sin datos parciales", async (offset) => {
    setup(1001, offset);
    expect(await listUserVacationGrants({ userId })).toEqual({
      success: false,
      error: "No se pudieron obtener las asignaciones del usuario",
    });
  });
  it("un error al leer consumos impide mostrar un historial incompleto", async () => {
    setup(2, undefined, true);
    expect(await listUserVacationGrants({ userId })).toEqual({
      success: false,
      error: "No se pudo obtener el historial de consumos",
    });
  });
  it("rechaza una sesión sin autorización antes de consultar", async () => {
    const { from } = setup();
    requireAdminContextMock.mockRejectedValue(new Error("No autorizado"));
    expect((await listUserVacationGrants({ userId })).success).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });
});
