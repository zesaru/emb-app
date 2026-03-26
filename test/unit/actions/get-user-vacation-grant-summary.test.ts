import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}));

describe("getUserVacationGrantSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resume grants y calcula proximo grant esperado", async () => {
    const authGetUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "viewer-1" } },
      error: null,
    });
    const userSingleMock = vi.fn().mockResolvedValue({
      data: { id: "user-1", hire_date: "2025-09-16" },
      error: null,
    });
    const grantsOrderMock = vi.fn().mockResolvedValue({
      data: [
        {
          granted_on: "2026-03-16",
          expires_on: "2028-03-16",
          days_granted: 10,
          days_remaining: 8,
        },
      ],
      error: null,
    });

    const fromMock = vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: userSingleMock,
            })),
          })),
        };
      }

      if (table === "vacation_grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: grantsOrderMock,
            })),
          })),
        };
      }

      throw new Error(`unexpected table ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: { getUser: authGetUserMock },
      from: fromMock,
    });

    const getUserVacationGrantSummary = (await import("@/actions/getUserVacationGrantSummary")).default;
    const result = await getUserVacationGrantSummary("user-1");

    expect(result).toEqual({
      totalGranted: 10,
      totalRemaining: 8,
      totalExpiredRemaining: 0,
      activeGrantCount: 1,
      nextExpiryDate: "2028-03-16",
      nextExpectedGrantDate: "2027-03-16",
    });
  });

  it("devuelve null si no hay sesion autenticada", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const getUserVacationGrantSummary = (await import("@/actions/getUserVacationGrantSummary")).default;
    const result = await getUserVacationGrantSummary("user-1");

    expect(result).toBeNull();
  });

  it("devuelve null si falla la lectura de grants", async () => {
    const authGetUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "viewer-1" } },
      error: null,
    });
    const userSingleMock = vi.fn().mockResolvedValue({
      data: { id: "user-1", hire_date: "2025-09-16" },
      error: null,
    });
    const grantsOrderMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const fromMock = vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: userSingleMock,
            })),
          })),
        };
      }

      if (table === "vacation_grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: grantsOrderMock,
            })),
          })),
        };
      }

      throw new Error(`unexpected table ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: { getUser: authGetUserMock },
      from: fromMock,
    });

    const getUserVacationGrantSummary = (await import("@/actions/getUserVacationGrantSummary")).default;
    const result = await getUserVacationGrantSummary("user-1");

    expect(result).toBeNull();
  });
});
