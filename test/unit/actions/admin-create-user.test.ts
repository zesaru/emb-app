import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();
const requireAdminContextMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

vi.mock("@/actions/admin/users/shared", () => ({
  requireAdminContext: (...args: any[]) => requireAdminContextMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: (...args: any[]) => getSupabaseAdminClientMock(...args),
}));

describe("createAdminUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  function mockProfileUpsert(profileError: unknown = null) {
    const upsertMock = vi.fn().mockResolvedValue({ error: profileError });
    const fromMock = vi.fn(() => ({ upsert: upsertMock }));

    requireAdminContextMock.mockResolvedValue({
      adminUserId: "admin-1",
      supabase: { from: fromMock },
    });

    return { fromMock, upsertMock };
  }

  it("crea usuario por invitacion y sincroniza perfil", async () => {
    const { upsertMock } = mockProfileUpsert();
    const inviteUserByEmailMock = vi.fn().mockResolvedValue({
      data: { user: { id: "new-auth-id" } },
      error: null,
    });
    getSupabaseAdminClientMock.mockReturnValue({
      auth: { admin: { inviteUserByEmail: inviteUserByEmailMock } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "newuser@example.com",
      name: "Nuevo Usuario",
      role: "admin",
      provisioningMode: "invite",
      numVacations: 5,
      numCompensatorys: 2,
    });

    expect(result.success).toBe(true);
    expect(inviteUserByEmailMock).toHaveBeenCalledWith("newuser@example.com");
    expect(upsertMock).toHaveBeenCalled();
    const [payload] = upsertMock.mock.calls[0];
    expect(payload).toMatchObject({
      id: "new-auth-id",
      email: "newuser@example.com",
      name: "Nuevo Usuario",
      role: "admin",
      admin: "admin",
      is_active: true,
      num_vacations: 5,
      num_compensatorys: 2,
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
  });

  it("retorna error cuando Auth no devuelve user id", async () => {
    mockProfileUpsert();
    const inviteUserByEmailMock = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    getSupabaseAdminClientMock.mockReturnValue({
      auth: { admin: { inviteUserByEmail: inviteUserByEmailMock } },
    });

    const createAdminUser = (await import("@/actions/admin/users/create-user")).default;
    const result = await createAdminUser({
      email: "nouid@example.com",
      name: "Sin ID",
      role: "user",
      provisioningMode: "invite",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("ID del usuario");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("retorna error si falla la sincronizacion del perfil", async () => {
    mockProfileUpsert({ message: "db down" });
    getSupabaseAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          inviteUserByEmail: vi.fn().mockResolvedValue({
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
    expect(result.error).toContain("sincronizar perfil");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
