import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserActiveMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) } }),
}));
vi.mock("@/lib/auth/admin-check", () => ({
  requireUserActive: (...args: unknown[]) => requireUserActiveMock(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({ from: () => ({ update: updateMock }) }),
}));

describe("markInvitationAccepted", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no acepta la invitación de una cuenta provisional", async () => {
    requireUserActiveMock.mockRejectedValue(new Error("Usuario inactivo"));
    const { markInvitationAccepted } = await import("@/actions/auth/mark-invitation-accepted");

    expect(await markInvitationAccepted()).toEqual({ success: false });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("acepta la invitación de una cuenta activa", async () => {
    requireUserActiveMock.mockResolvedValue(undefined);
    const eqLast = vi.fn().mockResolvedValue({ error: null });
    const eqFirst = vi.fn(() => ({ eq: eqLast }));
    updateMock.mockReturnValue({ eq: eqFirst });
    const { markInvitationAccepted } = await import("@/actions/auth/mark-invitation-accepted");

    expect(await markInvitationAccepted()).toEqual({ success: true });
    expect(requireUserActiveMock).toHaveBeenCalledWith("user-1");
    expect(eqLast).toHaveBeenCalledWith("invitation_status", "pending");
  });
});
