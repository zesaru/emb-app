import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserByIdMock = vi.fn();
const requireAdminContextMock = vi.fn();
const sendUserInvitationMock = vi.fn();
const revalidatePathMock = vi.fn();
const getAuthUserByIdMock = vi.fn();

vi.mock("@/actions/admin/users/shared", () => ({
  getUserById: (...args: unknown[]) => getUserByIdMock(...args),
  requireAdminContext: (...args: unknown[]) => requireAdminContextMock(...args),
}));
vi.mock("@/lib/email/send-user-invitation", () => ({
  sendUserInvitation: (...args: unknown[]) => sendUserInvitationMock(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({ auth: { admin: { getUserById: getAuthUserByIdMock } } }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

const userId = "550e8400-e29b-41d4-a716-446655440000";

describe("resendUserInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://emb-app.vercel.app";
    getUserByIdMock.mockResolvedValue({
      id: userId,
      email: "person@example.com",
      name: "Persona Prueba",
      provisioningStatus: "ready",
      invitationStatus: "pending",
    });
    const eq = vi.fn().mockResolvedValue({ error: null });
    requireAdminContextMock.mockResolvedValue({ supabase: { from: () => ({ update: () => ({ eq }) }) } });
    sendUserInvitationMock.mockResolvedValue({ success: true });
    getAuthUserByIdMock.mockResolvedValue({
      data: { user: { id: userId, email: "person@example.com", email_confirmed_at: null } },
      error: null,
    });
  });

  it("envía por la plantilla y actualiza la fecha de reenvío", async () => {
    const { resendUserInvitation } = await import("@/actions/admin/users/resend-user-invitation");
    const result = await resendUserInvitation({ userId });

    expect(result.success).toBe(true);
    expect(sendUserInvitationMock).toHaveBeenCalledWith({
      email: "person@example.com",
      name: "Persona Prueba",
      redirectTo: "https://emb-app.vercel.app/auth/complete-invite",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
  });

  it("no registra el reenvío si falla la entrega", async () => {
    sendUserInvitationMock.mockResolvedValue({ success: false, error: "El proveedor no respondió" });
    const update = vi.fn();
    requireAdminContextMock.mockResolvedValue({ supabase: { from: () => ({ update }) } });

    const { resendUserInvitation } = await import("@/actions/admin/users/resend-user-invitation");
    const result = await resendUserInvitation({ userId });

    expect(result).toEqual({ success: false, error: "El proveedor no respondió" });
    expect(update).not.toHaveBeenCalled();
  });

  it("no genera una nueva invitación si la cuenta ya confirmó el correo", async () => {
    getAuthUserByIdMock.mockResolvedValue({
      data: { user: { id: userId, email: "person@example.com", email_confirmed_at: "2026-09-30T10:00:00Z" } },
      error: null,
    });
    const { resendUserInvitation } = await import("@/actions/admin/users/resend-user-invitation");
    const result = await resendUserInvitation({ userId });

    expect(result).toMatchObject({ success: false, error: expect.stringContaining("ya aceptó") });
    expect(sendUserInvitationMock).not.toHaveBeenCalled();
  });
});
