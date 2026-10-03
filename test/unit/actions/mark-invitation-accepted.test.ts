import { beforeEach, describe, expect, it, vi } from "vitest";
import { markInvitationAccepted } from "@/actions/auth/mark-invitation-accepted";

const getUser = vi.fn();
const updateUser = vi.fn();
const requireUserActiveMock = vi.fn();
const profileResult = vi.fn();
const acceptedResult = vi.fn();
const acceptedEq = vi.fn();
const updateMock = vi.fn();
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser, updateUser },
    from: () => ({ select: () => ({ eq: () => ({ single: profileResult }) }) }),
  }),
}));
vi.mock("@/lib/auth/admin-check", () => ({ requireUserActive: (...args: unknown[]) => requireUserActiveMock(...args) }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: () => ({ from: () => ({ update: updateMock }) }) }));
const input = { password: "Contraseña-segura1!", confirmPassword: "Contraseña-segura1!" };

describe("markInvitationAccepted con contraseña", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    requireUserActiveMock.mockResolvedValue(undefined);
    profileResult.mockResolvedValue({ data: { provisioning_mode: "invite", invitation_status: "pending" }, error: null });
    updateUser.mockResolvedValue({ error: null });
    acceptedResult.mockResolvedValue({ error: null });
    acceptedEq.mockImplementation(() => ({ eq: acceptedResult }));
    updateMock.mockReturnValue({ eq: acceptedEq });
  });

  it.each([
    { password: "123", confirmPassword: "123" },
    { ...input, confirmPassword: "diferente" },
  ])("rechaza datos inválidos antes de cambiar Auth", async (values) => {
    expect((await markInvitationAccepted(values)).success).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rechaza una sesión ausente", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await markInvitationAccepted(input)).success).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("no acepta una cuenta provisional", async () => {
    requireUserActiveMock.mockRejectedValue(new Error("Usuario inactivo"));
    expect((await markInvitationAccepted(input)).success).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("no cambia la contraseña de una invitación ya aceptada", async () => {
    profileResult.mockResolvedValue({ data: { provisioning_mode: "invite", invitation_status: "accepted" }, error: null });
    expect((await markInvitationAccepted(input)).success).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("no cambia una cuenta creada con contraseña temporal", async () => {
    profileResult.mockResolvedValue({ data: { provisioning_mode: "temporary_password", invitation_status: "pending" }, error: null });
    expect((await markInvitationAccepted(input)).success).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("un fallo al consultar el perfil no permite cambiar Auth", async () => {
    profileResult.mockResolvedValue({ data: null, error: { message: "fallo" } });
    expect((await markInvitationAccepted(input)).success).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("un error de Auth conserva la invitación pendiente", async () => {
    updateUser.mockResolvedValue({ error: { code: "weak_password" } });
    expect((await markInvitationAccepted(input)).success).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("guarda primero la contraseña y acepta solo al usuario de la sesión", async () => {
    expect(await markInvitationAccepted(input)).toEqual({ success: true });
    expect(updateUser).toHaveBeenCalledWith({ password: input.password });
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(updateMock.mock.invocationCallOrder[0]);
    expect(acceptedEq).toHaveBeenCalledWith("id", "user-1");
    expect(acceptedResult).toHaveBeenCalledWith("invitation_status", "pending");
    expect(revalidatePath).toHaveBeenCalledWith("/welcome");
  });

  it("permite recuperar un fallo de perfil con la contraseña ya guardada", async () => {
    acceptedResult.mockResolvedValueOnce({ error: { message: "fallo" } });
    const first = await markInvitationAccepted(input);
    expect(first.success).toBe(false);
    expect(first).toHaveProperty("error", expect.stringContaining("La contraseña se guardó"));
    updateUser.mockResolvedValueOnce({ error: { code: "same_password" } });
    expect(await markInvitationAccepted(input)).toEqual({ success: true });
  });
});
