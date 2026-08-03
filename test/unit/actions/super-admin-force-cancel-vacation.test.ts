import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const revalidatePathMock = vi.fn();
const requireCurrentUserSuperAdminMock = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

vi.mock("@/lib/auth/admin-check", () => ({
  requireCurrentUserSuperAdmin: (...args: any[]) => requireCurrentUserSuperAdminMock(...args),
}));

const validVacationId = "123e4567-e89b-12d3-a456-426614174222";

describe("superAdminForceCancelVacation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza si el usuario autenticado no es super admin", async () => {
    requireCurrentUserSuperAdminMock.mockRejectedValue(new Error("No autorizado"));

    createClientMock.mockResolvedValue({
      rpc: vi.fn(() => {
        throw new Error("no debería llamar al RPC sin ser super admin");
      }),
    });

    const superAdminForceCancelVacation = (await import("@/actions/super-admin-force-cancel-vacation")).default;
    const result = await superAdminForceCancelVacation(validVacationId);

    expect(result).toEqual({ success: false, error: "No autorizado" });
  });

  it("rechaza un id inválido sin llamar al RPC", async () => {
    requireCurrentUserSuperAdminMock.mockResolvedValue(undefined);

    createClientMock.mockResolvedValue({
      rpc: vi.fn(() => {
        throw new Error("no debería llamar al RPC con un id inválido");
      }),
    });

    const superAdminForceCancelVacation = (await import("@/actions/super-admin-force-cancel-vacation")).default;
    const result = await superAdminForceCancelVacation("not-a-uuid");

    expect(result).toEqual({ success: false, error: "Datos inválidos" });
  });

  it("elimina correctamente vía RPC cuando el usuario es super admin, incluso ya aprobada", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    requireCurrentUserSuperAdminMock.mockResolvedValue(undefined);

    createClientMock.mockResolvedValue({ rpc: rpcMock });

    const superAdminForceCancelVacation = (await import("@/actions/super-admin-force-cancel-vacation")).default;
    const result = await superAdminForceCancelVacation(validVacationId);

    expect(result).toEqual({ success: true });
    expect(rpcMock).toHaveBeenCalledWith("super_admin_force_cancel_vacation", {
      p_id: validVacationId,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/vacaciones");
  });

  it("traduce el error del RPC cuando la solicitud ya estaba cancelada", async () => {
    requireCurrentUserSuperAdminMock.mockResolvedValue(undefined);
    const rpcMock = vi.fn().mockResolvedValue({ error: { message: "ALREADY_CANCELLED" } });

    createClientMock.mockResolvedValue({ rpc: rpcMock });

    const superAdminForceCancelVacation = (await import("@/actions/super-admin-force-cancel-vacation")).default;
    const result = await superAdminForceCancelVacation(validVacationId);

    expect(result).toEqual({
      success: false,
      error: "La solicitud ya estaba cancelada",
    });
  });
});
