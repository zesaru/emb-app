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

const compensatoryRow = [
  {
    id: "123e4567-e89b-12d3-a456-426614174111",
    hours: 4,
    event_name: "trabajo extra",
    event_date: "2026-07-01",
    user1: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Test User",
      email: "user@example.com",
      num_compensatorys: 10,
    },
  },
];

describe("UpdateCompensatorio", () => {
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

    const UpdateCompensatorio = (await import("@/actions/updateCompensatorio")).default;
    const result = await UpdateCompensatorio(compensatoryRow as any);

    expect(result).toEqual({ success: false, error: "No autorizado" });
  });

  it("acredita horas vía RPC atómico en vez de un update directo con valor stale", async () => {
    requireCurrentUserAdminMock.mockResolvedValue(undefined);

    const compensatorysUpdateSelect = vi.fn().mockResolvedValue({ data: [{}], error: null });
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    const refreshedUserSingle = vi.fn().mockResolvedValue({
      data: { num_compensatorys: 14 },
      error: null,
    });

    const usersFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: refreshedUserSingle,
        })),
      })),
    }));

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
                select: compensatorysUpdateSelect,
              })),
            })),
          };
        }
        if (table === "users") {
          return usersFrom();
        }
        throw new Error(`unexpected table ${table}`);
      }),
      rpc: rpcMock,
    });

    const UpdateCompensatorio = (await import("@/actions/updateCompensatorio")).default;
    const result = await UpdateCompensatorio(compensatoryRow as any);

    expect(result).toEqual({ success: true });
    // El balance se acredita vía el mismo RPC atómico que updateApproveRegister,
    // no vía un .update() directo con un valor "currentHours + hours" potencialmente stale.
    expect(rpcMock).toHaveBeenCalledWith("accumulate_compensatory_hours", {
      hours: compensatoryRow[0].hours,
      user_id: compensatoryRow[0].user1.id,
    });
  });

  it("retorna error si falla el RPC de acreditación de horas", async () => {
    requireCurrentUserAdminMock.mockResolvedValue(undefined);

    const compensatorysUpdateSelect = vi.fn().mockResolvedValue({ data: [{}], error: null });
    const rpcMock = vi.fn().mockResolvedValue({ error: { message: "rpc failed" } });

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
                select: compensatorysUpdateSelect,
              })),
            })),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
      rpc: rpcMock,
    });

    const UpdateCompensatorio = (await import("@/actions/updateCompensatorio")).default;
    const result = await UpdateCompensatorio(compensatoryRow as any);

    expect(result).toEqual({ success: false, error: "Error al actualizar horas del usuario" });
  });

  it("rechaza datos inválidos si falta user1 en el registro", async () => {
    requireCurrentUserAdminMock.mockResolvedValue(undefined);

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => {
        throw new Error("no debería consultar la tabla con datos inválidos");
      }),
      rpc: vi.fn(),
    });

    const UpdateCompensatorio = (await import("@/actions/updateCompensatorio")).default;
    const result = await UpdateCompensatorio([{ id: "123e4567-e89b-12d3-a456-426614174111" }] as any);

    expect(result).toEqual({ success: false, error: "Datos inválidos" });
  });
});
