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
    const vacationUpdateSelectMock = vi.fn().mockResolvedValue({ error: null });
    const grantUpdateSelectMock = vi.fn().mockResolvedValue({ error: null });
    const consumptionInsertSelectMock = vi.fn().mockResolvedValue({ error: null });
    const vacationSingleMock = vi.fn().mockResolvedValue({
      data: { start: "2026-04-01", finish: "2026-04-03" },
      error: null,
    });
    const userSingleMock = vi.fn().mockResolvedValue({
      data: { name: "Cesar Murillo" },
      error: null,
    });

    const fromMock = vi.fn((table: string) => {
      if (table === "vacation_grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gt: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "grant-1",
                        granted_on: "2026-03-16",
                        expires_on: "2028-03-16",
                        days_remaining: 10,
                      },
                    ],
                    error: null,
                  }),
                })),
              })),
            })),
            single: vacationSingleMock,
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: grantUpdateSelectMock,
              })),
            })),
          })),
        };
      }

      if (table === "vacation_grant_consumptions") {
        return {
          insert: vi.fn(() => ({
            select: consumptionInsertSelectMock,
          })),
        };
      }

      if (table === "vacations") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vacationUpdateSelectMock,
            })),
          })),
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
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn().mockResolvedValue({ error: null }),
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
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
    expect(revalidatePathMock).toHaveBeenCalledWith("/vacaciones/123e4567-e89b-12d3-a456-426614174000");
  });

  it("hace fallback a num_vacations si no alcanza el saldo por grants", async () => {
    const vacationUpdateSelectMock = vi.fn().mockResolvedValue({ error: null });
    const userUpdateSelectMock = vi.fn().mockResolvedValue({ error: null });
    const vacationSingleMock = vi.fn().mockResolvedValue({
      data: { start: "2026-04-01", finish: "2026-04-03" },
      error: null,
    });
    const userSingleMock = vi.fn().mockResolvedValue({
      data: { name: "Cesar Murillo" },
      error: null,
    });
    const userUpdateMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: userUpdateSelectMock,
      })),
    }));

    const fromMock = vi.fn((table: string) => {
      if (table === "vacation_grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gt: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "grant-1",
                        granted_on: "2026-03-16",
                        expires_on: "2028-03-16",
                        days_remaining: 2,
                      },
                    ],
                    error: null,
                  }),
                })),
              })),
            })),
            single: vacationSingleMock,
          })),
        };
      }

      if (table === "vacations") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vacationUpdateSelectMock,
            })),
          })),
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
          update: userUpdateMock,
        };
      }

      if (table === "vacation_grant_consumptions") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn().mockResolvedValue({ error: null }),
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
    expect(userUpdateMock).toHaveBeenCalled();
  });
});
