import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

const validCompensatorioId = "123e4567-e89b-12d3-a456-426614174111";

describe("cancelCompensatorio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna error si no hay sesión", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      rpc: vi.fn(() => {
        throw new Error("no debería llamar al RPC sin sesión");
      }),
    });

    const cancelCompensatorio = (await import("@/actions/cancel-compensatorio")).default;
    const result = await cancelCompensatorio(validCompensatorioId);

    expect(result).toEqual({ success: false, error: "No autenticado" });
  });

  it("rechaza un id inválido sin llamar al RPC", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      rpc: vi.fn(() => {
        throw new Error("no debería llamar al RPC con un id inválido");
      }),
    });

    const cancelCompensatorio = (await import("@/actions/cancel-compensatorio")).default;
    const result = await cancelCompensatorio("not-a-uuid");

    expect(result).toEqual({ success: false, error: "Datos inválidos" });
  });

  it("cancela correctamente vía RPC cuando el usuario es dueño y está pendiente", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ error: null });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      rpc: rpcMock,
    });

    const cancelCompensatorio = (await import("@/actions/cancel-compensatorio")).default;
    const result = await cancelCompensatorio(validCompensatorioId);

    expect(result).toEqual({ success: true });
    expect(rpcMock).toHaveBeenCalledWith("cancel_own_compensatorio", {
      p_id: validCompensatorioId,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/compensatorios/user-1");
  });

  it("traduce el error del RPC cuando la solicitud ya fue aprobada", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ error: { message: "ALREADY_APPROVED" } });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      rpc: rpcMock,
    });

    const cancelCompensatorio = (await import("@/actions/cancel-compensatorio")).default;
    const result = await cancelCompensatorio(validCompensatorioId);

    expect(result).toEqual({
      success: false,
      error: "No se puede cancelar una solicitud ya aprobada",
    });
  });

  it("traduce el error del RPC cuando la solicitud ya estaba cancelada", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ error: { message: "ALREADY_CANCELLED" } });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      rpc: rpcMock,
    });

    const cancelCompensatorio = (await import("@/actions/cancel-compensatorio")).default;
    const result = await cancelCompensatorio(validCompensatorioId);

    expect(result).toEqual({
      success: false,
      error: "La solicitud ya estaba cancelada",
    });
  });
});
