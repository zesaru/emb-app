import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();
const requireAdminContextMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

vi.mock("@/actions/admin/users/shared", () => ({
  requireAdminContext: (...args: any[]) => requireAdminContextMock(...args),
}));

describe("Admin Vacation Grants Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("crea un grant cuando el usuario es elegible y no existe duplicado", async () => {
    const singleUserMock = vi.fn().mockResolvedValue({
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        hire_date: "2024-01-01",
        weekly_days: 5,
        weekly_hours: 40,
        attendance_eligible: true,
      },
      error: null,
    });
    const maybeSingleGrantMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const insertedGrant = {
      id: "grant-1",
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      granted_on: "2024-07-01",
      service_band: "6_months",
    };
    const insertSingleMock = vi.fn().mockResolvedValue({ data: insertedGrant, error: null });

    const fromMock = vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: singleUserMock,
            })),
          })),
        };
      }

      if (table === "vacation_grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: maybeSingleGrantMock,
                })),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: insertSingleMock,
            })),
          })),
        };
      }

      throw new Error(`unexpected table ${table}`);
    });

    requireAdminContextMock.mockResolvedValue({
      adminUserId: "admin-1",
      supabase: { from: fromMock },
    });

    const issueUserVacationGrant = (await import("@/actions/admin/vacation-grants/issue-user-grant")).default;
    const result = await issueUserVacationGrant({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      grantedOn: "2024-07-01",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject(insertedGrant);
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
  });

  it("rechaza grants con asistencia pendiente", async () => {
    const singleUserMock = vi.fn().mockResolvedValue({
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        hire_date: "2024-01-01",
        weekly_days: 5,
        weekly_hours: 40,
        attendance_eligible: null,
      },
      error: null,
    });

    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: singleUserMock,
        })),
      })),
    }));

    requireAdminContextMock.mockResolvedValue({
      adminUserId: "admin-1",
      supabase: { from: fromMock },
    });

    const issueUserVacationGrant = (await import("@/actions/admin/vacation-grants/issue-user-grant")).default;
    const result = await issueUserVacationGrant({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      grantedOn: "2024-07-01",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("80%");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("calcula y delega la emision del siguiente grant", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T00:00:00.000Z"));

    const issueUserVacationGrantMock = vi.fn().mockResolvedValue({
      success: true,
      message: "Grant de vacaciones creado",
    });

    vi.doMock("@/actions/admin/vacation-grants/issue-user-grant", () => ({
      __esModule: true,
      default: issueUserVacationGrantMock,
    }));

    const singleUserMock = vi.fn().mockResolvedValue({
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        hire_date: "2024-01-01",
      },
      error: null,
    });
    const maybeSingleGrantMock = vi.fn().mockResolvedValue({
      data: { granted_on: "2024-07-01" },
      error: null,
    });

    const fromMock = vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: singleUserMock,
            })),
          })),
        };
      }

      if (table === "vacation_grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: maybeSingleGrantMock,
                })),
              })),
            })),
          })),
        };
      }

      throw new Error(`unexpected table ${table}`);
    });

    requireAdminContextMock.mockResolvedValue({
      adminUserId: "admin-1",
      supabase: { from: fromMock },
    });

    const issueNextUserVacationGrant = (await import("@/actions/admin/vacation-grants/issue-next-user-grant")).default;
    const result = await issueNextUserVacationGrant({
      userId: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result.success).toBe(true);
    expect(issueUserVacationGrantMock).toHaveBeenCalledWith({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      grantedOn: "2025-07-01",
      notes: null,
    });

    vi.useRealTimers();
  });

  it("actualiza un grant existente del usuario", async () => {
    const grantId = "123e4567-e89b-12d3-a456-426614174999";

    const maybeSingleGrantMock = vi.fn().mockResolvedValue({
      data: {
        id: grantId,
        user_id: "123e4567-e89b-12d3-a456-426614174000",
      },
      error: null,
    });
    const updatedGrant = {
      id: grantId,
      user_id: "123e4567-e89b-12d3-a456-426614174000",
      granted_on: "2024-07-02",
      service_band: "6_months",
      days_granted: 10,
      days_remaining: 8,
      expires_on: "2026-07-02",
      rule_type: "standard",
      notes: "ajuste manual",
    };
    const updateSingleMock = vi.fn().mockResolvedValue({ data: updatedGrant, error: null });

    const fromMock = vi.fn((table: string) => {
      if (table === "vacation_grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: maybeSingleGrantMock,
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: updateSingleMock,
                })),
              })),
            })),
          })),
        };
      }

      throw new Error(`unexpected table ${table}`);
    });

    requireAdminContextMock.mockResolvedValue({
      adminUserId: "admin-1",
      supabase: { from: fromMock },
    });

    const updateUserVacationGrant = (await import("@/actions/admin/vacation-grants/update-user-grant")).default;
    const result = await updateUserVacationGrant({
      id: grantId,
      userId: "123e4567-e89b-12d3-a456-426614174000",
      grantedOn: "2024-07-02",
      serviceBand: "6_months",
      daysGranted: 10,
      daysRemaining: 8,
      expiresOn: "2026-07-02",
      ruleType: "standard",
      notes: "ajuste manual",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject(updatedGrant);
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
    expect(revalidatePathMock).toHaveBeenCalledWith("/vacaciones/123e4567-e89b-12d3-a456-426614174000");
  });
});
