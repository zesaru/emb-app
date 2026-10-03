import { beforeEach, describe, expect, it, vi } from "vitest";
const authorize = vi.fn();
const from = vi.fn();
vi.mock("@/lib/auth/admin-check", () => ({ requireCurrentUserAdminAndActive: () => authorize() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ from }) }));

describe("resumen de aprobaciones del inicio", () => {
  beforeEach(() => { vi.resetAllMocks(); authorize.mockResolvedValue("admin-id"); });
  it("consulta solo cantidades y conserva las condiciones de los contadores", async () => {
    const filters: Array<Array<[string, unknown]>> = [];
    const selects = vi.fn();
    let index = 0;
    from.mockImplementation(() => {
      const current = index++;
      filters[current] = [];
      const query: any = {
        select: (...args: unknown[]) => { selects(...args); return query; },
        is: (key: string, value: unknown) => { filters[current].push([key, value]); return query; },
        not: (key: string, op: string, value: unknown) => { filters[current].push([key, [op, value]]); return query; },
        or: (value: string) => { filters[current].push(["or", value]); return query; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ count: [4, 1, 2][current], error: null }).then(resolve),
      };
      return query;
    });
    const { getDashboardApprovalSummary } = await import("@/actions/get-dashboard-approval-summary");
    expect(await getDashboardApprovalSummary()).toEqual({ pendingCompensatoryRequests: 4, pendingCompensatoryRests: 1, pendingVacations: 2 });
    expect(selects).toHaveBeenCalledTimes(3);
    expect(selects).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(filters[0]).toEqual([["event_name", ["is", null]], ["approve_request", null], ["cancelled_at", null]]);
    expect(filters[1]).toEqual([["event_name", null], ["final_approve_request", null], ["cancelled_at", null]]);
    expect(filters[2]).toEqual([["or", "approve_request.is.null,approve_request.eq.false"]]);
  });
  it("rechaza usuarios sin permisos antes de consultar datos", async () => {
    authorize.mockRejectedValue(new Error("No autorizado"));
    const { getDashboardApprovalSummary } = await import("@/actions/get-dashboard-approval-summary");
    await expect(getDashboardApprovalSummary()).rejects.toThrow("No autorizado");
    expect(from).not.toHaveBeenCalled();
  });
  it("no presenta cero como resultado de una consulta fallida", async () => {
    const query: any = { select: () => query, is: () => query, not: () => query, or: () => query,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ count: null, error: { message: "fallo" } }).then(resolve) };
    from.mockReturnValue(query);
    const { getDashboardApprovalSummary } = await import("@/actions/get-dashboard-approval-summary");
    await expect(getDashboardApprovalSummary()).rejects.toThrow("No se pudieron cargar las aprobaciones");
  });
});
