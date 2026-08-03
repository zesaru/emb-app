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

const requestPayload = {
  id: "123e4567-e89b-12d3-a456-426614174111",
  user_id: "123e4567-e89b-12d3-a456-426614174000",
  email: "user@example.com",
  hours: 4,
};

describe("updateApproveRegister", () => {
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
        throw new Error("no debería consultar la tabla sin ser admin");
      }),
      rpc: vi.fn(() => {
        throw new Error("no debería llamar al RPC sin ser admin");
      }),
    });

    const updateApproveRegister = (await import("@/actions/updateApproveRegister")).default;
    const result = await updateApproveRegister(requestPayload);

    expect(result).toEqual({ success: false, error: "No autorizado" });
  });

  it("usa los valores de la fila actualizada (por id) para acreditar horas, no el payload crudo del cliente", async () => {
    requireCurrentUserAdminMock.mockResolvedValue(undefined);

    // La fila real en la base de datos tiene valores distintos a los que
    // envía el cliente -- el RPC debe usar los de la fila, no los del payload.
    const updatedRow = {
      id: requestPayload.id,
      user_id: "123e4567-e89b-12d3-a456-426614174999",
      hours: 2,
    };

    const singleMock = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
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
                select: vi.fn(() => ({
                  single: singleMock,
                })),
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

    const updateApproveRegister = (await import("@/actions/updateApproveRegister")).default;
    const result = await updateApproveRegister(requestPayload);

    expect(result.success).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith("accumulate_compensatory_hours", {
      hours: updatedRow.hours,
      user_id: updatedRow.user_id,
    });
    // Nunca debe usar los valores del payload del cliente para acreditar horas.
    expect(rpcMock).not.toHaveBeenCalledWith(
      "accumulate_compensatory_hours",
      expect.objectContaining({ hours: requestPayload.hours, user_id: requestPayload.user_id }),
    );
  });

  it("retorna error si falla el update y nunca llama al RPC", async () => {
    requireCurrentUserAdminMock.mockResolvedValue(undefined);

    const singleMock = vi.fn().mockResolvedValue({ data: null, error: { message: "db error" } });
    const rpcMock = vi.fn();

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
            select: vi.fn(() => ({
              single: singleMock,
            })),
          })),
        })),
      })),
      rpc: rpcMock,
    });

    const updateApproveRegister = (await import("@/actions/updateApproveRegister")).default;
    const result = await updateApproveRegister(requestPayload);

    expect(result).toEqual({ success: false, error: "Error al actualizar el registro" });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
