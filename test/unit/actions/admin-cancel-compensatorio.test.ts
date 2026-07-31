import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const revalidatePathMock = vi.fn();
const requireCurrentUserAdminMock = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

vi.mock("@/lib/auth/admin-check", () => ({
  requireCurrentUserAdmin: (...args: any[]) => requireCurrentUserAdminMock(...args),
}));

const validCompensatorioId = "123e4567-e89b-12d3-a456-426614174111";

describe("adminCancelCompensatorio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza si el usuario autenticado no es admin", async () => {
    requireCurrentUserAdminMock.mockRejectedValue(new Error("No autorizado"));

    createClientMock.mockResolvedValue({
      rpc: vi.fn(() => {
        throw new Error("no debería llamar al RPC sin ser admin");
      }),
    });

    const adminCancelCompensatorio = (await import("@/actions/admin-cancel-compensatorio")).default;
    const result = await adminCancelCompensatorio(validCompensatorioId);

    expect(result).toEqual({ success: false, error: "No autorizado" });
  });

  it("rechaza un id inválido sin llamar al RPC", async () => {
    requireCurrentUserAdminMock.mockResolvedValue(undefined);

    createClientMock.mockResolvedValue({
      rpc: vi.fn(() => {
        throw new Error("no debería llamar al RPC con un id inválido");
      }),
    });

    const adminCancelCompensatorio = (await import("@/actions/admin-cancel-compensatorio")).default;
    const result = await adminCancelCompensatorio("not-a-uuid");

    expect(result).toEqual({ success: false, error: "Datos inválidos" });
  });

  it("elimina correctamente vía RPC cuando el usuario es admin", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    requireCurrentUserAdminMock.mockResolvedValue(undefined);

    createClientMock.mockResolvedValue({ rpc: rpcMock });

    const adminCancelCompensatorio = (await import("@/actions/admin-cancel-compensatorio")).default;
    const result = await adminCancelCompensatorio(validCompensatorioId);

    expect(result).toEqual({ success: true });
    expect(rpcMock).toHaveBeenCalledWith("admin_cancel_compensatorio", {
      p_id: validCompensatorioId,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/compensatorios");
  });

  it("traduce el error del RPC cuando la solicitud ya fue aprobada", async () => {
    requireCurrentUserAdminMock.mockResolvedValue(undefined);
    const rpcMock = vi.fn().mockResolvedValue({ error: { message: "ALREADY_APPROVED" } });

    createClientMock.mockResolvedValue({ rpc: rpcMock });

    const adminCancelCompensatorio = (await import("@/actions/admin-cancel-compensatorio")).default;
    const result = await adminCancelCompensatorio(validCompensatorioId);

    expect(result).toEqual({
      success: false,
      error: "No se puede eliminar una solicitud ya aprobada",
    });
  });
});
