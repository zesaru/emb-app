import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();

const requireAdminContextMock = vi.fn();
const getUserByIdMock = vi.fn();
const countActiveAdminsMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

vi.mock("@/actions/admin/users/shared", () => ({
  requireAdminContext: (...args: any[]) => requireAdminContextMock(...args),
  getUserById: (...args: any[]) => getUserByIdMock(...args),
  countActiveAdmins: (...args: any[]) => countActiveAdminsMock(...args),
}));

describe("Admin Users Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deactivateAdminUser", () => {
    it("bloquea auto-desactivacion", async () => {
      requireAdminContextMock.mockResolvedValue({
        adminUserId: "admin-1",
        supabase: {},
      });
      getUserByIdMock.mockResolvedValue({
        id: "admin-1",
        role: "admin",
      });

      const deactivateAdminUser = (await import("@/actions/admin/users/deactivate-user")).default;
      const result = await deactivateAdminUser({
        userId: "11111111-1111-4111-8111-111111111111",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("desactivarte");
      expect(countActiveAdminsMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });

    it("bloquea desactivar al ultimo admin activo", async () => {
      requireAdminContextMock.mockResolvedValue({
        adminUserId: "admin-1",
        supabase: {},
      });
      getUserByIdMock.mockResolvedValue({
        id: "admin-2",
        role: "admin",
      });
      countActiveAdminsMock.mockResolvedValue(0);

      const deactivateAdminUser = (await import("@/actions/admin/users/deactivate-user")).default;
      const result = await deactivateAdminUser({
        userId: "22222222-2222-4222-8222-222222222222",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("último administrador");
      expect(countActiveAdminsMock).toHaveBeenCalledWith("admin-2");
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });

    it("desactiva usuario y revalida cuando pasa validaciones", async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn(() => ({ eq: eqMock }));
      const fromMock = vi.fn(() => ({ update: updateMock }));

      requireAdminContextMock.mockResolvedValue({
        adminUserId: "admin-1",
        supabase: { from: fromMock },
      });
      getUserByIdMock.mockResolvedValue({
        id: "user-2",
        role: "user",
      });

      const deactivateAdminUser = (await import("@/actions/admin/users/deactivate-user")).default;
      const result = await deactivateAdminUser({
        userId: "33333333-3333-4333-8333-333333333333",
      });

      expect(result.success).toBe(true);
      expect(fromMock).toHaveBeenCalledWith("users");
      expect(updateMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith("id", "33333333-3333-4333-8333-333333333333");
      expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
    });
  });

  describe("updateAdminUser", () => {
    it("bloquea quitarse el propio rol admin", async () => {
      requireAdminContextMock.mockResolvedValue({
        adminUserId: "admin-1",
        supabase: {},
      });
      getUserByIdMock.mockResolvedValue({
        id: "admin-1",
        role: "admin",
      });

      const updateAdminUser = (await import("@/actions/admin/users/update-user")).default;
      const result = await updateAdminUser({
        id: "44444444-4444-4444-8444-444444444444",
        role: "user",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("propio rol");
      expect(countActiveAdminsMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });

    it("bloquea quitar rol al ultimo admin activo", async () => {
      requireAdminContextMock.mockResolvedValue({
        adminUserId: "admin-1",
        supabase: {},
      });
      getUserByIdMock.mockResolvedValue({
        id: "admin-2",
        role: "admin",
      });
      countActiveAdminsMock.mockResolvedValue(0);

      const updateAdminUser = (await import("@/actions/admin/users/update-user")).default;
      const result = await updateAdminUser({
        id: "55555555-5555-4555-8555-555555555555",
        role: "user",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("último administrador");
      expect(countActiveAdminsMock).toHaveBeenCalledWith("admin-2");
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });

    it("actualiza y revalida cuando la validacion de rol pasa", async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn(() => ({ eq: eqMock }));
      const fromMock = vi.fn(() => ({ update: updateMock }));

      requireAdminContextMock.mockResolvedValue({
        adminUserId: "admin-1",
        supabase: { from: fromMock },
      });
      getUserByIdMock.mockResolvedValue({
        id: "user-2",
        role: "user",
      });

      const updateAdminUser = (await import("@/actions/admin/users/update-user")).default;
      const result = await updateAdminUser({
        id: "66666666-6666-4666-8666-666666666666",
        name: "Nuevo Nombre",
        role: "user",
        numVacations: 3,
        numCompensatorys: 1,
      });

      expect(result.success).toBe(true);
      expect(fromMock).toHaveBeenCalledWith("users");
      expect(updateMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith("id", "66666666-6666-4666-8666-666666666666");
      expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
    });
  });
});
