import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const revalidatePathMock = vi.fn();
const requireCurrentUserAdminMock = vi.fn();
const resendSendMock = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

vi.mock("@/lib/auth/admin-check", () => ({
  requireCurrentUserAdmin: (...args: any[]) => requireCurrentUserAdminMock(...args),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function ResendMock() {
    return {
      emails: {
        send: (...args: any[]) => resendSendMock(...args),
      },
    };
  }),
}));

describe("UpdateVacations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireCurrentUserAdminMock.mockResolvedValue(undefined);
    resendSendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  it("consume vacation_grants cuando hay saldo suficiente", async () => {
    const vacationSingleMock = vi.fn().mockResolvedValue({
      data: { start: "2026-04-01", finish: "2026-04-03" },
      error: null,
    });
    const userSingleMock = vi.fn().mockResolvedValue({
      data: { name: "Cesar Murillo" },
      error: null,
    });
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ used_grant_balance: true, remaining_balance: 7 }],
      error: null,
    });

    const fromMock = vi.fn((table: string) => {
      if (table === "vacations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vacationSingleMock,
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
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-1" } },
          error: null,
        }),
      },
      from: fromMock,
      rpc: rpcMock,
    });

    const updateVacations = (await import("@/actions/updateVacations")).default;
    const result = await updateVacations({
      id: "123e4567-e89b-12d3-a456-426614174111",
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      email: "user@example.com",
      num_vacations: 0,
      days: 3,
    });

    expect(result.success).toBe(true);
    expect(result.usedGrantBalance).toBe(true);
    expect(result.remainingGrantBalance).toBe(7);
    expect(rpcMock).toHaveBeenCalledWith(
      "approve_vacation_with_grants",
      expect.objectContaining({
        p_vacation_id: "123e4567-e89b-12d3-a456-426614174111",
        p_user_id: "123e4567-e89b-12d3-a456-426614174000",
        p_days: 3,
        p_legacy_balance: 0,
        p_allow_legacy_fallback: true,
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
    expect(revalidatePathMock).toHaveBeenCalledWith("/vacaciones/123e4567-e89b-12d3-a456-426614174000");
  });

  it("hace fallback a num_vacations si no alcanza el saldo por grants", async () => {
    const vacationSingleMock = vi.fn().mockResolvedValue({
      data: { start: "2026-04-01", finish: "2026-04-03" },
      error: null,
    });
    const userSingleMock = vi.fn().mockResolvedValue({
      data: { name: "Cesar Murillo" },
      error: null,
    });
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ used_grant_balance: false, remaining_balance: 7 }],
      error: null,
    });

    const fromMock = vi.fn((table: string) => {
      if (table === "vacations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vacationSingleMock,
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
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-1" } },
          error: null,
        }),
      },
      from: fromMock,
      rpc: rpcMock,
    });

    const updateVacations = (await import("@/actions/updateVacations")).default;
    const result = await updateVacations({
      id: "123e4567-e89b-12d3-a456-426614174111",
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      email: "user@example.com",
      num_vacations: 10,
      days: 3,
    });

    expect(result.success).toBe(true);
    expect(result.usedGrantBalance).toBe(false);
    expect(result.remainingGrantBalance).toBeNull();
    expect(rpcMock).toHaveBeenCalled();
  });
});
