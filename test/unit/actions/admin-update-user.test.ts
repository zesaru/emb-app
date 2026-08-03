import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();
const requireCurrentUserSuperAdminAndActiveMock = vi.fn();
const requireAdminContextMock = vi.fn();
const getUserByIdMock = vi.fn();
const countActiveAdminsMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

vi.mock("@/lib/auth/admin-check", () => ({
  requireCurrentUserSuperAdminAndActive: (...args: any[]) => requireCurrentUserSuperAdminAndActiveMock(...args),
}));

vi.mock("@/actions/admin/users/shared", () => ({
  requireAdminContext: (...args: any[]) => requireAdminContextMock(...args),
  getUserById: (...args: any[]) => getUserByIdMock(...args),
  countActiveAdmins: (...args: any[]) => countActiveAdminsMock(...args),
}));

const targetId = "123e4567-e89b-12d3-a456-426614174333";
const adminId = "123e4567-e89b-12d3-a456-426614174444";

function makeSupabaseUpdateStub() {
  const eqMock = vi.fn().mockResolvedValue({ error: null });
  const updateMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ update: updateMock }));
  return { from: fromMock, __mocks: { fromMock, updateMock, eqMock } };
}

describe("updateAdminUser - restricción de rol a super admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextMock.mockResolvedValue({
      supabase: makeSupabaseUpdateStub(),
      adminUserId: adminId,
    });
    countActiveAdminsMock.mockResolvedValue(2);
  });

  it("un admin normal no puede promover a un usuario a admin", async () => {
    getUserByIdMock.mockResolvedValue({ id: targetId, role: "user" });
    requireCurrentUserSuperAdminAndActiveMock.mockRejectedValue(
      new Error("No autorizado: Se requieren privilegios de super administrador"),
    );

    const { updateAdminUser } = await import("@/actions/admin/users/update-user");
    const result = await updateAdminUser({ id: targetId, role: "admin" });

    expect(result).toEqual({
      success: false,
      error: "No autorizado: Se requieren privilegios de super administrador",
    });
    expect(requireCurrentUserSuperAdminAndActiveMock).toHaveBeenCalled();
  });

  it("un admin normal no puede degradar a otro admin", async () => {
    getUserByIdMock.mockResolvedValue({ id: targetId, role: "admin" });
    requireCurrentUserSuperAdminAndActiveMock.mockRejectedValue(
      new Error("No autorizado: Se requieren privilegios de super administrador"),
    );

    const { updateAdminUser } = await import("@/actions/admin/users/update-user");
    const result = await updateAdminUser({ id: targetId, role: "user" });

    expect(result.success).toBe(false);
    expect(requireCurrentUserSuperAdminAndActiveMock).toHaveBeenCalled();
  });

  it("un admin normal SÍ puede editar campos no relacionados a rol de un usuario", async () => {
    getUserByIdMock.mockResolvedValue({ id: targetId, role: "user" });

    const { updateAdminUser } = await import("@/actions/admin/users/update-user");
    const result = await updateAdminUser({ id: targetId, name: "Nuevo Nombre" });

    expect(result.success).toBe(true);
    expect(requireCurrentUserSuperAdminAndActiveMock).not.toHaveBeenCalled();
  });

  it("un super admin sí puede promover a un usuario a admin", async () => {
    getUserByIdMock.mockResolvedValue({ id: targetId, role: "user" });
    requireCurrentUserSuperAdminAndActiveMock.mockResolvedValue(adminId);

    const { updateAdminUser } = await import("@/actions/admin/users/update-user");
    const result = await updateAdminUser({ id: targetId, role: "admin" });

    expect(result.success).toBe(true);
  });
});
