import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const revalidatePathMock = vi.fn();
const requireCurrentUserAdminMock = vi.fn();
const sendOrCaptureEmailMock = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

vi.mock("@/lib/auth/admin-check", () => ({
  requireCurrentUserAdmin: (...args: any[]) => requireCurrentUserAdminMock(...args),
}));

vi.mock("@/lib/email/dev-email-outbox", () => ({
  sendOrCaptureEmail: (...args: any[]) => sendOrCaptureEmailMock(...args),
}));

const validCompensatory = {
  id: "123e4567-e89b-12d3-a456-426614174111",
  user_id: "123e4567-e89b-12d3-a456-426614174000",
  email: "user@example.com",
  compensated_hours: 4,
};

describe("updateApproveRegisterHour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendOrCaptureEmailMock.mockResolvedValue({});
  });

  it("rechaza la aprobación si el usuario autenticado no es admin", async () => {
    requireCurrentUserAdminMock.mockRejectedValue(new Error("No autorizado"));

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "regular-user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => {
        throw new Error("no debería llegar a consultar la tabla sin ser admin");
      }),
      rpc: vi.fn(() => {
        throw new Error("no debería llamar al RPC sin ser admin");
      }),
    });

    const updateApproveRegisterHour = (await import("@/actions/updateRegisterHour")).default;
    const result = await updateApproveRegisterHour(validCompensatory);

    expect(result).toEqual({ success: false, error: "No autorizado" });
  });

  it("propaga el error si falla el update de la tabla compensatorys", async () => {
    requireCurrentUserAdminMock.mockResolvedValue(undefined);

    const updateSelectMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "db error" },
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: updateSelectMock,
          })),
        })),
      })),
      rpc: vi.fn(),
    });

    const updateApproveRegisterHour = (await import("@/actions/updateRegisterHour")).default;
    const result = await updateApproveRegisterHour(validCompensatory);

    expect(result).toEqual({ success: false, error: "Error al actualizar el registro" });
  });

  it("aprueba correctamente cuando el usuario es admin y no hay errores", async () => {
    requireCurrentUserAdminMock.mockResolvedValue(undefined);

    const updateSelectMock = vi.fn().mockResolvedValue({ data: [{}], error: null });
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    const userSingleMock = vi.fn().mockResolvedValue({
      data: { name: "Test User", num_compensatorys: 10 },
      error: null,
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-1" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "compensatorys") {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: updateSelectMock,
              })),
            })),
          };
        }
        if (table === "users") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: userSingleMock,
              })),
            })),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
      rpc: rpcMock,
    });

    const updateApproveRegisterHour = (await import("@/actions/updateRegisterHour")).default;
    const result = await updateApproveRegisterHour(validCompensatory);

    expect(result).toEqual({ success: true });
    expect(rpcMock).toHaveBeenCalledWith("subtract_compensatory_hours", {
      hours: validCompensatory.compensated_hours,
      user_id: validCompensatory.user_id,
    });
  });
});
