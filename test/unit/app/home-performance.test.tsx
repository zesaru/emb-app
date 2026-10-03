import { beforeEach, describe, expect, it, vi } from "vitest";
const getUser = vi.fn();
const profile = vi.fn();
const requests = vi.fn();
const rests = vi.fn();
const vacations = vi.fn();
const summary = vi.fn();
vi.mock("@/lib/auth/request-user", () => ({
  getRequestUser: () => getUser(),
  getRequestUserProfile: async () => ({ data: (await profile())?.[0], error: null }),
}));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/actions/getCompensatoriosNoApproved", () => ({ default: () => requests() }));
vi.mock("@/actions/getCompensatoriosHourNoapproved", () => ({ default: () => rests() }));
vi.mock("@/actions/getVacationsNoApproved", () => ({ default: () => vacations() }));
vi.mock("@/actions/get-dashboard-approval-summary", () => ({ getDashboardApprovalSummary: () => summary() }));
vi.mock("@/app/(dashboard)/_components/usertabs", () => ({ default: () => null }));
vi.mock("@/app/(dashboard)/_components/data-table", () => ({ DataTable: () => null }));
vi.mock("@/app/(dashboard)/_components/data-table-hour", () => ({ DataTableHour: () => null }));
vi.mock("@/app/(dashboard)/_components/data-table-vacaciones", () => ({ DataTableVacations: () => null }));
vi.mock("@/app/(dashboard)/_components/columns", () => ({ columns: [] }));
vi.mock("@/app/(dashboard)/_components/columns-hour", () => ({ columnsHour: [] }));
vi.mock("@/app/(dashboard)/_components/columms-vacations", () => ({ columnVacations: [] }));
import Home from "@/app/(dashboard)/(routes)/(root)/page";

describe("carga del inicio según permisos", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "user-id", email: "test@example.test" } } });
    profile.mockResolvedValue([{ id: "user-id", admin: null }]);
    requests.mockResolvedValue([]); rests.mockResolvedValue([]); vacations.mockResolvedValue([]);
    summary.mockResolvedValue({ pendingCompensatoryRequests: 0, pendingCompensatoryRests: 0, pendingVacations: 0 });
  });
  it("el usuario normal no consulta colas ni resumen administrativos", async () => {
    expect(await Home()).toBeTruthy();
    expect(requests).not.toHaveBeenCalled(); expect(rests).not.toHaveBeenCalled();
    expect(vacations).not.toHaveBeenCalled(); expect(summary).not.toHaveBeenCalled();
  });
  it("el administrador carga las colas y el resumen", async () => {
    profile.mockResolvedValue([{ id: "user-id", admin: "admin" }]);
    expect(await Home()).toBeTruthy();
    expect(requests).toHaveBeenCalledOnce(); expect(rests).toHaveBeenCalledOnce();
    expect(vacations).toHaveBeenCalledOnce(); expect(summary).toHaveBeenCalledOnce();
  });
  it("redirige una sesión ausente antes de consultar perfiles", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(Home()).rejects.toThrow("REDIRECT:/login");
    expect(profile).not.toHaveBeenCalled();
  });
});
