import { render } from "@react-email/render";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserInvitation } from "@/components/email/templates/system/user-invitation";

const generateLinkMock = vi.fn();
const sendOrCaptureEmailMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({ auth: { admin: { generateLink: generateLinkMock } } }),
}));
vi.mock("@/lib/email/dev-email-outbox", () => ({
  sendOrCaptureEmail: (...args: unknown[]) => sendOrCaptureEmailMock(...args),
}));

const input = {
  email: "newuser@example.com",
  name: "Nueva Persona",
  redirectTo: "https://emb-app.vercel.app/auth/complete-invite",
};

describe("sendUserInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateLinkMock.mockResolvedValue({
      data: { properties: { action_link: "https://example.com/auth/v1/verify?token=secret" } },
      error: null,
    });
    sendOrCaptureEmailMock.mockResolvedValue({ success: true, deliveryMode: "sent" });
  });

  it("renderiza la invitación con el enlace generado por Supabase", async () => {
    const { sendUserInvitation } = await import("@/lib/email/send-user-invitation");
    const result = await sendUserInvitation(input);

    expect(result).toEqual({ success: true });
    expect(generateLinkMock).toHaveBeenCalledWith({
      type: "invite", email: input.email, options: { redirectTo: input.redirectTo },
    });
    expect(sendOrCaptureEmailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: input.email, templateName: "UserInvitation", subject: "Invitación a EMB-APP",
    }));
    const html = await render(sendOrCaptureEmailMock.mock.calls[0][0].react);
    expect(html).toContain("Nueva Persona");
    expect(html).toContain("Aceptar invitación");
    expect(html).toContain("https://example.com/auth/v1/verify?token=secret");
  });

  it("no intenta entregar correo si no puede generar el enlace", async () => {
    generateLinkMock.mockResolvedValue({ data: null, error: new Error("Auth failed") });
    const { sendUserInvitation } = await import("@/lib/email/send-user-invitation");

    expect(await sendUserInvitation(input)).toMatchObject({ success: false, deliveryAttempted: false });
    expect(sendOrCaptureEmailMock).not.toHaveBeenCalled();
  });

  it("no genera enlaces si la entrega está deshabilitada", async () => {
    process.env.EMAIL_DELIVERY_ENABLED = "false";
    try {
      const { sendUserInvitation } = await import("@/lib/email/send-user-invitation");
      expect(await sendUserInvitation(input)).toMatchObject({ success: false, deliveryAttempted: false });
      expect(generateLinkMock).not.toHaveBeenCalled();
    } finally {
      delete process.env.EMAIL_DELIVERY_ENABLED;
    }
  });

  it("no considera enviada una invitación capturada en desarrollo", async () => {
    sendOrCaptureEmailMock.mockResolvedValue({ success: true, deliveryMode: "captured" });
    const { sendUserInvitation } = await import("@/lib/email/send-user-invitation");

    expect(await sendUserInvitation(input)).toMatchObject({ success: false, deliveryAttempted: false });
  });

  it("informa incertidumbre cuando el proveedor de correo falla", async () => {
    sendOrCaptureEmailMock.mockRejectedValue(new Error("timeout"));
    const { sendUserInvitation } = await import("@/lib/email/send-user-invitation");

    expect(await sendUserInvitation(input)).toMatchObject({ success: false, deliveryAttempted: true });
  });
});

it("escapa el nombre al renderizar la plantilla", async () => {
  const html = await render(React.createElement(UserInvitation, {
    userName: "<script>alert(1)</script>",
    invitationUrl: "https://example.com/invite",
  }));

  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
});
