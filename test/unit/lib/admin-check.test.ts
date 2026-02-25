import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}));

function makeQuerySingleClient(singleResult: unknown) {
  const singleMock = vi.fn().mockResolvedValue(singleResult);
  const eqMock = vi.fn(() => ({ single: singleMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ select: selectMock }));

  return {
    auth: { getUser: vi.fn() },
    from: fromMock,
    __mocks: { fromMock, selectMock, eqMock, singleMock },
  };
}

describe("lib/auth/admin-check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("requireAdmin / isAdmin", () => {
    it("permite cuando el usuario tiene admin=admin", async () => {
      const client = makeQuerySingleClient({ data: { admin: "admin" }, error: null });
      createClientMock.mockResolvedValue(client);

      const { requireAdmin } = await import("@/lib/auth/admin-check");
      await expect(requireAdmin("user-1")).resolves.toBeUndefined();

      expect(client.__mocks.fromMock).toHaveBeenCalledWith("users");
      expect(client.__mocks.selectMock).toHaveBeenCalledWith("admin");
      expect(client.__mocks.eqMock).toHaveBeenCalledWith("id", "user-1");
    });

    it("lanza error si la consulta falla", async () => {
      createClientMock.mockResolvedValue(
        makeQuerySingleClient({ data: null, error: { message: "db error" } }),
      );

      const { requireAdmin } = await import("@/lib/auth/admin-check");
      await expect(requireAdmin("user-2")).rejects.toThrow("Error verificando permisos");
    });

    it("lanza error si no es admin", async () => {
      createClientMock.mockResolvedValue(
        makeQuerySingleClient({ data: { admin: null }, error: null }),
      );

      const { requireAdmin } = await import("@/lib/auth/admin-check");
      await expect(requireAdmin("user-3")).rejects.toThrow("No autorizado");
    });

    it("isAdmin retorna false cuando requireAdmin falla", async () => {
      createClientMock.mockResolvedValue(
        makeQuerySingleClient({ data: { admin: null }, error: null }),
      );

      const { isAdmin } = await import("@/lib/auth/admin-check");
      await expect(isAdmin("user-4")).resolves.toBe(false);
    });
  });

  describe("requireUserActive", () => {
    it("acepta valores nulos como activos por compatibilidad", async () => {
      createClientMock.mockResolvedValue(
        makeQuerySingleClient({ data: { is_active: null }, error: null }),
      );

      const { requireUserActive } = await import("@/lib/auth/admin-check");
      await expect(requireUserActive("user-5")).resolves.toBeUndefined();
    });

    it("rechaza boolean false", async () => {
      createClientMock.mockResolvedValue(
        makeQuerySingleClient({ data: { is_active: false }, error: null }),
      );

      const { requireUserActive } = await import("@/lib/auth/admin-check");
      await expect(requireUserActive("user-6")).rejects.toThrow("Usuario inactivo");
    });

    it("rechaza string inactivo", async () => {
      createClientMock.mockResolvedValue(
        makeQuerySingleClient({ data: { is_active: "inactivo" }, error: null }),
      );

      const { requireUserActive } = await import("@/lib/auth/admin-check");
      await expect(requireUserActive("user-7")).rejects.toThrow("Usuario inactivo");
    });

    it("lanza error si falla la consulta", async () => {
      createClientMock.mockResolvedValue(
        makeQuerySingleClient({ data: null, error: { message: "db error" } }),
      );

      const { requireUserActive } = await import("@/lib/auth/admin-check");
      await expect(requireUserActive("user-8")).rejects.toThrow("Error verificando estado del usuario");
    });
  });

  describe("requireCurrentUserAdminAndActive", () => {
    it("retorna user id cuando autenticado, activo y admin", async () => {
      const authClient = {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-1" } }, error: null }) },
        from: vi.fn(),
      };
      const activeClient = makeQuerySingleClient({ data: { is_active: "true" }, error: null });
      const adminClient = makeQuerySingleClient({ data: { admin: "admin" }, error: null });

      createClientMock
        .mockResolvedValueOnce(authClient)
        .mockResolvedValueOnce(activeClient)
        .mockResolvedValueOnce(adminClient);

      const { requireCurrentUserAdminAndActive } = await import("@/lib/auth/admin-check");
      await expect(requireCurrentUserAdminAndActive()).resolves.toBe("auth-1");
    });

    it("lanza error cuando no hay usuario autenticado", async () => {
      createClientMock.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
        from: vi.fn(),
      });

      const { requireCurrentUserAdminAndActive } = await import("@/lib/auth/admin-check");
      await expect(requireCurrentUserAdminAndActive()).rejects.toThrow("No autenticado");
    });
  });
});
