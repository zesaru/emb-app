import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();
const requireAdminContextMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();
const requireCurrentUserSuperAdminAndActiveMock = vi.fn();
const sendUserInvitationMock = vi.fn();

vi.mock("@/lib/email/send-user-invitation", () => ({
  sendUserInvitation: (...args: unknown[]) => sendUserInvitationMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

vi.mock("@/actions/admin/users/shared", () => ({
  requireAdminContext: (...args: any[]) => requireAdminContextMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: (...args: any[]) => getSupabaseAdminClientMock(...args),
}));

vi.mock("@/lib/auth/admin-check", () => ({
  requireCurrentUserSuperAdminAndActive: (...args: any[]) => requireCurrentUserSuperAdminAndActiveMock(...args),
}));

describe("createAdminUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    requireCurrentUserSuperAdminAndActiveMock.mockResolvedValue("super-admin-1");
    sendUserInvitationMock.mockResolvedValue({ success: true });
    process.env.NEXT_PUBLIC_APP_URL = "https://emb-app.vercel.app";
  });

  function mockProfileUpsert(profileError: unknown = null) {
    const upsertMock = vi.fn().mockResolvedValue({ error: profileError });
    const activationMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn(() => ({ eq: activationMock }));
    const fromMock = vi.fn(() => ({ upsert: upsertMock, update: updateMock }));

    requireAdminContextMock.mockResolvedValue({
      adminUserId: "admin-1",
      supabase: { from: fromMock },
    });

    return { fromMock, upsertMock, updateMock, activationMock };
  }

  function mockDispatchClaim(claimed = true) {
    const chain: any = {};
    chain.eq = vi.fn(() => chain);
    chain.is = vi.fn(() => chain);
    chain.lt = vi.fn(() => chain);
    chain.select = vi.fn(() => chain);
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: claimed ? { id: "claimed" } : null, error: null });
    return vi.fn(() => ({ update: vi.fn(() => chain) }));
  }

  it("rechaza una invitación sin URL de retorno antes de crear Auth", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    mockProfileUpsert();
    const createUserMock = vi.fn();
    getSupabaseAdminClientMock.mockReturnValue({ auth: { admin: { createUser: createUserMock } } });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "missing-url@example.com", name: "Sin URL", role: "user", provisioningMode: "invite",
    });

    expect(result).toMatchObject({ success: false, state: "failed" });
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("no crea una cuenta si la entrega de correo está deshabilitada", async () => {
    process.env.EMAIL_DELIVERY_ENABLED = "false";
    try {
      mockProfileUpsert();
      const createUserMock = vi.fn();
      getSupabaseAdminClientMock.mockReturnValue({ auth: { admin: { createUser: createUserMock } } });

      const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
      const result = await createAdminUser({
        email: "no-mail@example.com", name: "Sin Correo", role: "user", provisioningMode: "invite",
      });

      expect(result).toMatchObject({ success: false, state: "failed" });
      expect(createUserMock).not.toHaveBeenCalled();
    } finally {
      delete process.env.EMAIL_DELIVERY_ENABLED;
    }
  });

  it("crea usuario por invitacion y sincroniza perfil", async () => {
    const { upsertMock } = mockProfileUpsert();
    const inviteUserByEmailMock = vi.fn().mockResolvedValue({
      data: { user: { id: "new-auth-id" } },
      error: null,
    });
    const createUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "new-auth-id" } }, error: null,
    });
    getSupabaseAdminClientMock.mockReturnValue({
      from: mockDispatchClaim(),
      auth: { admin: { createUser: createUserMock, inviteUserByEmail: inviteUserByEmailMock } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "newuser@example.com",
      name: "Nuevo Usuario",
      role: "admin",
      provisioningMode: "invite",
      weeklyDays: 5,
      weeklyHours: 40,
      attendanceEligible: true,
      numVacations: 5,
      numCompensatorys: 2,
    });

    expect(result.success).toBe(true);
    expect(result.state).toBe("created");
    expect(requireCurrentUserSuperAdminAndActiveMock).toHaveBeenCalledOnce();
    expect(sendUserInvitationMock).toHaveBeenCalledWith({
      email: "newuser@example.com",
      name: "Nuevo Usuario",
      redirectTo: "https://emb-app.vercel.app/auth/complete-invite",
    });
    expect(createUserMock).toHaveBeenCalledWith(expect.objectContaining({
      email: "newuser@example.com", email_confirm: false,
    }));
    expect(upsertMock).toHaveBeenCalled();
    const [payload] = upsertMock.mock.calls[0];
    expect(payload).toMatchObject({
      id: "new-auth-id",
      email: "newuser@example.com",
      name: "Nuevo Usuario",
      role: "admin",
      admin: "admin",
      is_active: false,
      provisioning_status: "pending",
      weekly_days: 5,
      weekly_hours: 40,
      attendance_eligible: true,
      num_vacations: 5,
      num_compensatorys: 2,
      invitation_status: "pending",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
  });

  it("crea usuario con password temporal usando Auth admin.createUser", async () => {
    mockProfileUpsert();
    const createUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "temp-auth-id" } },
      error: null,
    });
    getSupabaseAdminClientMock.mockReturnValue({
      auth: { admin: { createUser: createUserMock } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "temp@example.com",
      name: "Temp User",
      role: "user",
      provisioningMode: "temporary_password",
      temporaryPassword: "Temp12345!",
    });

    expect(result.success).toBe(true);
    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "temp@example.com",
        password: "Temp12345!",
        email_confirm: true,
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
    expect(requireCurrentUserSuperAdminAndActiveMock).not.toHaveBeenCalled();
  });

  it("rechaza crear un admin si el actor no es super admin antes de crear Auth", async () => {
    mockProfileUpsert();
    const inviteUserByEmailMock = vi.fn();
    getSupabaseAdminClientMock.mockReturnValue({
      auth: { admin: { createUser: vi.fn(), inviteUserByEmail: inviteUserByEmailMock } },
    });
    requireCurrentUserSuperAdminAndActiveMock.mockRejectedValue(new Error("No autorizado"));

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "newadmin@example.com",
      name: "Nuevo Admin",
      role: "admin",
      provisioningMode: "invite",
    });

    expect(result).toEqual({ success: false, state: "failed", error: "No autorizado" });
    expect(sendUserInvitationMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("retorna error cuando Auth no devuelve user id", async () => {
    mockProfileUpsert();
    const createUserMock = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    getSupabaseAdminClientMock.mockReturnValue({
      auth: { admin: { createUser: createUserMock } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "nouid@example.com",
      name: "Sin ID",
      role: "user",
      provisioningMode: "invite",
    });

    expect(result.success).toBe(false);
    expect(result.state).toBe("failed");
    expect(result.error).toContain("ID del usuario");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("retorna error si falla la sincronizacion del perfil", async () => {
    mockProfileUpsert({ message: "db down" });
    getSupabaseAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-err" } },
            error: null,
          }),
        },
      },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "syncfail@example.com",
      name: "Sync Fail",
      role: "user",
      provisioningMode: "invite",
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      state: "incomplete",
      userId: "auth-err",
      emailMayHaveBeenSent: false,
    });
    expect(result.error).toContain("sincronizar perfil");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("conserva el ID de Auth cuando el upsert lanza tras crear la cuenta", async () => {
    const { upsertMock } = mockProfileUpsert();
    upsertMock.mockRejectedValue(new Error("network timeout"));
    getSupabaseAdminClientMock.mockReturnValue({
      auth: { admin: { createUser: vi.fn().mockResolvedValue({
        data: { user: { id: "temp-uncertain" } },
        error: null,
      }) } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "timeout@example.com",
      name: "Timeout",
      role: "user",
      provisioningMode: "temporary_password",
      temporaryPassword: "Temp12345!",
    });

    expect(result).toMatchObject({
      success: false,
      state: "incomplete",
      userId: "temp-uncertain",
      emailMayHaveBeenSent: false,
    });
  });

  it("prepara el perfil inactivo antes de enviar la invitación y activa al final", async () => {
    const operations: string[] = [];
    const upsertMock = vi.fn().mockImplementation(async (payload) => {
      operations.push("profile");
      expect(payload).toMatchObject({ is_active: false, provisioning_status: "pending" });
      return { error: null };
    });
    const eqMock = vi.fn().mockImplementation(async () => {
      operations.push("activate");
      return { error: null };
    });
    const updateMock = vi.fn().mockImplementation((payload) => {
      expect(payload).toMatchObject({ is_active: true, provisioning_status: "ready" });
      return { eq: eqMock };
    });
    requireAdminContextMock.mockResolvedValue({
      adminUserId: "admin-1",
      supabase: { from: vi.fn(() => ({ upsert: upsertMock, update: updateMock })) },
    });
    const createUserMock = vi.fn().mockImplementation(async () => {
      operations.push("auth");
      return { data: { user: { id: "staged-id" } }, error: null };
    });
    sendUserInvitationMock.mockImplementation(async () => {
      operations.push("invite");
      return { success: true };
    });
    const claimFrom = mockDispatchClaim();
    getSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({
        update: (payload: Record<string, unknown>) => {
          if (payload.invitation_sent_at) {
            return { eq: async () => {
              operations.push("record-send");
              return { error: null };
            } };
          }
          return claimFrom().update();
        },
      })),
      auth: { admin: { createUser: createUserMock } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "staged@example.com", name: "Staged", role: "user", provisioningMode: "invite",
    });

    expect(result.state).toBe("created");
    expect(operations).toEqual(["auth", "profile", "invite", "record-send", "activate"]);
  });

  it("un fallo de invitación deja la cuenta pendiente sin activarla", async () => {
    const { activationMock } = mockProfileUpsert();
    sendUserInvitationMock.mockResolvedValue({
      success: false, deliveryAttempted: true, error: "SMTP failed",
    });
    getSupabaseAdminClientMock.mockReturnValue({
      from: mockDispatchClaim(),
      auth: { admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: "mail-fail-id" } }, error: null }),
      } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "mailfail@example.com", name: "Mail Fail", role: "user", provisioningMode: "invite",
    });

    expect(result).toMatchObject({ success: false, state: "incomplete", userId: "mail-fail-id" });
    expect(activationMock).not.toHaveBeenCalled();
  });

  it("no marca un correo como enviado si falla la generación del enlace", async () => {
    const { activationMock } = mockProfileUpsert();
    sendUserInvitationMock.mockResolvedValue({
      success: false, deliveryAttempted: false, error: "No se pudo generar el enlace de invitación",
    });
    getSupabaseAdminClientMock.mockReturnValue({
      from: mockDispatchClaim(),
      auth: { admin: { createUser: vi.fn().mockResolvedValue({
        data: { user: { id: "link-fail-id" } }, error: null,
      }) } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "linkfail@example.com", name: "Link Fail", role: "user", provisioningMode: "invite",
    });

    expect(result).toMatchObject({
      success: false, state: "incomplete", userId: "link-fail-id", emailMayHaveBeenSent: false,
    });
    expect(activationMock).not.toHaveBeenCalled();
  });

  it("no confunde invited_at de un enlace generado con un correo entregado al reanudar", async () => {
    mockProfileUpsert();
    const dispatchFrom = mockDispatchClaim();
    getSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({
        ...dispatchFrom(),
        select: () => ({ eq: () => ({ single: async () => ({
          data: { provisioning_status: "pending", provisioning_mode: "invite", invitation_sent_at: null },
          error: null,
        }) }) }),
      })),
      auth: { admin: {
        createUser: vi.fn(),
        getUserById: vi.fn().mockResolvedValue({ data: { user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "retry-m365@example.com",
          invited_at: "2026-09-30T05:00:00Z",
          user_metadata: { provisioning_mode: "invite", invitation_delivery: "m365" },
        } }, error: null }),
      } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      resumeUserId: "550e8400-e29b-41d4-a716-446655440000",
      email: "retry-m365@example.com", name: "Retry", role: "user", provisioningMode: "invite",
    });

    expect(result.state).toBe("created");
    expect(sendUserInvitationMock).toHaveBeenCalledOnce();
  });

  it("no invita de nuevo a quien ya confirmó el correo durante un alta pendiente", async () => {
    const { activationMock, updateMock } = mockProfileUpsert();
    getSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({ select: () => ({ eq: () => ({ single: async () => ({
        data: { provisioning_status: "pending", provisioning_mode: "invite", invitation_sent_at: null },
        error: null,
      }) }) }) })),
      auth: { admin: {
        createUser: vi.fn(),
        getUserById: vi.fn().mockResolvedValue({ data: { user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "accepted@example.com",
          email_confirmed_at: "2026-09-30T09:00:00Z",
          user_metadata: { provisioning_mode: "invite", invitation_delivery: "m365" },
        } }, error: null }),
      } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      resumeUserId: "550e8400-e29b-41d4-a716-446655440000",
      email: "accepted@example.com", name: "Aceptada", role: "user", provisioningMode: "invite",
    });

    expect(result.state).toBe("created");
    expect(sendUserInvitationMock).not.toHaveBeenCalled();
    expect(activationMock).toHaveBeenCalledOnce();
    expect(updateMock.mock.calls[0][0]).toMatchObject({
      invitation_accepted_at: "2026-09-30T09:00:00Z",
    });
    expect(updateMock.mock.calls[0][0]).not.toHaveProperty("invitation_sent_at");
  });

  it("no duplica el correo si otra petición reservó el envío", async () => {
    const { activationMock } = mockProfileUpsert();
    const inviteUserByEmailMock = vi.fn();
    const claimFromMock = mockDispatchClaim(false);
    getSupabaseAdminClientMock.mockReturnValue({
      from: claimFromMock,
      auth: { admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: "concurrent-id" } }, error: null }),
        inviteUserByEmail: inviteUserByEmailMock,
        getUserById: vi.fn().mockResolvedValue({ data: { user: { id: "concurrent-id", invited_at: null } }, error: null }),
      } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "concurrent@example.com", name: "Concurrent", role: "user", provisioningMode: "invite",
    });

    expect(result).toMatchObject({ success: false, state: "incomplete", userId: "concurrent-id" });
    expect(sendUserInvitationMock).not.toHaveBeenCalled();
    expect(activationMock).not.toHaveBeenCalled();
  });

  it("reanuda por ID sin crear Auth ni reenviar una invitación registrada", async () => {
    const { upsertMock, activationMock } = mockProfileUpsert();
    const inviteUserByEmailMock = vi.fn();
    const createUserMock = vi.fn();
    const singleMock = vi.fn().mockResolvedValue({ data: { provisioning_status: "pending" }, error: null });
    getSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({ select: () => ({ eq: () => ({ single: singleMock }) }) })),
      auth: { admin: {
        createUser: createUserMock,
        inviteUserByEmail: inviteUserByEmailMock,
        getUserById: vi.fn().mockResolvedValue({ data: { user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "retry@example.com",
          invited_at: "2026-09-30T05:00:00Z",
        } }, error: null }),
      } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      resumeUserId: "550e8400-e29b-41d4-a716-446655440000",
      email: "retry@example.com", name: "Retry", role: "user", provisioningMode: "invite",
    });

    expect(result.state).toBe("created");
    expect(createUserMock).not.toHaveBeenCalled();
    expect(sendUserInvitationMock).not.toHaveBeenCalled();
    expect(upsertMock).toHaveBeenCalledOnce();
    expect(activationMock).toHaveBeenCalledOnce();
  });

  it("mantiene la cuenta pendiente si falla la activación después del envío", async () => {
    const { activationMock } = mockProfileUpsert();
    activationMock.mockResolvedValue({ error: new Error("write failed") });
    getSupabaseAdminClientMock.mockReturnValue({
      from: mockDispatchClaim(),
      auth: { admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: "activation-fail" } }, error: null }),
        inviteUserByEmail: vi.fn().mockResolvedValue({ error: null }),
      } },
    });
    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "activation@example.com", name: "Activation", role: "user", provisioningMode: "invite",
    });

    expect(result).toMatchObject({
      success: false, state: "incomplete", userId: "activation-fail", emailMayHaveBeenSent: true,
    });
  });

  it("reanuda un alta con contraseña temporal sin volver a crear Auth", async () => {
    const { activationMock } = mockProfileUpsert();
    const createUserMock = vi.fn();
    const inviteUserByEmailMock = vi.fn();
    getSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({ select: () => ({ eq: () => ({
        single: async () => ({ data: { provisioning_status: "pending", provisioning_mode: "temporary_password" }, error: null }),
      }) }) })),
      auth: { admin: {
        createUser: createUserMock,
        inviteUserByEmail: inviteUserByEmailMock,
        getUserById: vi.fn().mockResolvedValue({ data: { user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "temp-retry@example.com",
          user_metadata: { provisioning_mode: "temporary_password" },
        } }, error: null }),
      } },
    });
    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      resumeUserId: "550e8400-e29b-41d4-a716-446655440000",
      email: "temp-retry@example.com", name: "Retry", role: "user", provisioningMode: "temporary_password",
    });

    expect(result.state).toBe("created");
    expect(createUserMock).not.toHaveBeenCalled();
    expect(sendUserInvitationMock).not.toHaveBeenCalled();
    expect(activationMock).toHaveBeenCalledOnce();
  });
});
