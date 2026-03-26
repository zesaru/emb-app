import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminContextMock = vi.fn();

vi.mock("@/actions/admin/users/shared", () => ({
  requireAdminContext: (...args: any[]) => requireAdminContextMock(...args),
}));

describe("listUserVacationGrants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista grants del usuario en orden descendente", async () => {
    const orderCreatedAtMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "grant-2",
          granted_on: "2025-07-01",
        },
        {
          id: "grant-1",
          granted_on: "2024-07-01",
        },
      ],
      error: null,
    });

    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            order: orderCreatedAtMock,
          })),
        })),
      })),
    }));

    requireAdminContextMock.mockResolvedValue({
      adminUserId: "admin-1",
      supabase: { from: fromMock },
    });

    const listUserVacationGrants = (await import("@/actions/admin/vacation-grants/list-user-grants")).default;
    const result = await listUserVacationGrants({
      userId: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.id).toBe("grant-2");
  });

  it("devuelve error controlado si Supabase falla", async () => {
    const orderCreatedAtMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            order: orderCreatedAtMock,
          })),
        })),
      })),
    }));

    requireAdminContextMock.mockResolvedValue({
      adminUserId: "admin-1",
      supabase: { from: fromMock },
    });

    const listUserVacationGrants = (await import("@/actions/admin/vacation-grants/list-user-grants")).default;
    const result = await listUserVacationGrants({
      userId: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("grants del usuario");
  });
});
