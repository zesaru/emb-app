import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const requireUserActiveMock = vi.fn();
const profileResult = vi.fn();

vi.mock("@/utils/supabase/server", () => ({ createClient: () => createClientMock() }));
vi.mock("@/lib/auth/admin-check", () => ({ requireUserActive: (...args: unknown[]) => requireUserActiveMock(...args) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/app/(dashboard)/_components/navbar", () => ({ default: () => null }));
vi.mock("@/app/(dashboard)/_components/sidebar", () => ({ default: () => null }));

describe("dashboard access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserActiveMock.mockResolvedValue(undefined);
    profileResult.mockResolvedValue({ data: { provisioning_mode: null, invitation_status: null }, error: null });
    createClientMock.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "ready-id" } } }) },
      from: () => ({ select: () => ({ eq: () => ({ single: profileResult }) }) }),
    });
  });

  it("rechaza una sesión sin usuario", async () => {
    createClientMock.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: null } }) } });
    const { default: DashboardLayout } = await import("@/app/(dashboard)/layout");

    await expect(DashboardLayout({ children: null })).rejects.toThrow("REDIRECT:/login");
    expect(requireUserActiveMock).not.toHaveBeenCalled();
  });

  it("rechaza una cuenta provisional", async () => {
    createClientMock.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: "pending-id" } } }) } });
    requireUserActiveMock.mockRejectedValue(new Error("Usuario inactivo"));
    const { default: DashboardLayout } = await import("@/app/(dashboard)/layout");

    await expect(DashboardLayout({ children: null })).rejects.toThrow("REDIRECT:/login");
    expect(requireUserActiveMock).toHaveBeenCalledWith("pending-id");
  });

  it("permite una cuenta activa", async () => {
    const { default: DashboardLayout } = await import("@/app/(dashboard)/layout");

    const result = await DashboardLayout({ children: null });
    expect(result).toBeTruthy();
    expect(requireUserActiveMock).toHaveBeenCalledWith("ready-id");
  });

  it("redirige una invitación pendiente a crear contraseña", async () => {
    profileResult.mockResolvedValue({ data: { provisioning_mode: "invite", invitation_status: "pending" }, error: null });
    const { default: DashboardLayout } = await import("@/app/(dashboard)/layout");
    await expect(DashboardLayout({ children: null })).rejects.toThrow("REDIRECT:/welcome");
  });

  it("permite una invitación ya aceptada", async () => {
    profileResult.mockResolvedValue({ data: { provisioning_mode: "invite", invitation_status: "accepted" }, error: null });
    const { default: DashboardLayout } = await import("@/app/(dashboard)/layout");
    expect(await DashboardLayout({ children: null })).toBeTruthy();
  });

  it("un error de perfil no permite entrar al panel", async () => {
    profileResult.mockResolvedValue({ data: null, error: { message: "fallo" } });
    const { default: DashboardLayout } = await import("@/app/(dashboard)/layout");
    await expect(DashboardLayout({ children: null })).rejects.toThrow("REDIRECT:/login");
  });
});
