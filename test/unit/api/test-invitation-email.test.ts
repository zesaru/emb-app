import { render } from "@react-email/render";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const getUserMock = vi.fn();
const sendOrCaptureEmailMock = vi.fn();

vi.mock("@/lib/auth/admin-check", () => ({
  requireCurrentUserAdminAndActive: (...args: unknown[]) => requireAdminMock(...args),
}));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}));
vi.mock("@/lib/email/dev-email-outbox", () => ({
  sendOrCaptureEmail: (...args: unknown[]) => sendOrCaptureEmailMock(...args),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkApiRateLimit: () => ({ success: true }),
}));

const request = () => new Request("https://emb-app.vercel.app/api/admin/test-invitation-email", { method: "POST" });

describe("POST /api/admin/test-invitation-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue("admin-1");
    getUserMock.mockResolvedValue({ data: { user: {
      id: "admin-1", email: "admin@example.com", user_metadata: { name: "Admin Prueba" },
    } } });
    sendOrCaptureEmailMock.mockResolvedValue({ success: true, deliveryMode: "sent" });
  });

  it("envía una vista previa sin enlace solo al administrador autenticado", async () => {
    const { POST } = await import("@/app/api/admin/test-invitation-email/route");
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(sendOrCaptureEmailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "admin@example.com", templateName: "UserInvitationPreview", triggeredByUserId: "admin-1",
    }));
    const html = await render(sendOrCaptureEmailMock.mock.calls[0][0].react);
    expect(html).toContain("Admin Prueba");
    expect(html).toContain("no incluye un enlace de acceso");
    expect(html).not.toContain("/auth/v1/verify");
  });

  it("rechaza a quien no tenga rol de administrador", async () => {
    requireAdminMock.mockRejectedValue(new Error("Forbidden"));
    const { POST } = await import("@/app/api/admin/test-invitation-email/route");

    expect((await POST(request())).status).toBe(403);
    expect(sendOrCaptureEmailMock).not.toHaveBeenCalled();
  });

  it("informa un error si el transporte no confirma el envío", async () => {
    sendOrCaptureEmailMock.mockRejectedValue(new Error("Graph failed"));
    const { POST } = await import("@/app/api/admin/test-invitation-email/route");

    expect((await POST(request())).status).toBe(500);
  });
});
