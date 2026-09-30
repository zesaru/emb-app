import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserByIdMock = vi.fn();
const requireAdminContextMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/actions/admin/users/shared", () => ({
  getUserById: (...args: unknown[]) => getUserByIdMock(...args),
  requireAdminContext: (...args: unknown[]) => requireAdminContextMock(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => getSupabaseAdminClientMock(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const userId = "550e8400-e29b-41d4-a716-446655440000";

describe("cuentas con alta pendiente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextMock.mockResolvedValue({ supabase: { from: () => ({ update: updateMock }) } });
    getUserByIdMock.mockResolvedValue({
      id: userId, email: "pending@example.com", invitationStatus: "pending", provisioningStatus: "pending",
    });
  });

  it("no permite reactivarlas mediante la acción normal", async () => {
    const { reactivateAdminUser } = await import("@/actions/admin/users/reactivate-user");
    const result = await reactivateAdminUser({ userId });

    expect(result).toMatchObject({ success: false, error: expect.stringContaining("Completa el alta") });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("no reenvía invitaciones antes de completar el perfil", async () => {
    const inviteMock = vi.fn();
    getSupabaseAdminClientMock.mockReturnValue({ auth: { admin: { inviteUserByEmail: inviteMock } } });
    const { resendUserInvitation } = await import("@/actions/admin/users/resend-user-invitation");
    const result = await resendUserInvitation({ userId });

    expect(result).toMatchObject({ success: false, error: expect.stringContaining("Completa el alta") });
    expect(inviteMock).not.toHaveBeenCalled();
  });
});
