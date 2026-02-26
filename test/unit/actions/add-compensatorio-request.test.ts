import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const { sendEmailMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
}));
const { resolveEmailRecipientsMock } = vi.hoisted(() => ({
  resolveEmailRecipientsMock: vi.fn((recipients: string | string[]) => recipients),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendEmailMock };
  },
}));

vi.mock("@/components/email/utils/email-config", () => ({
  getFromEmail: vi.fn(() => "EMB <noreply@example.com>"),
  buildUrl: vi.fn((path: string) => `http://localhost:3003${path}`),
  resolveEmailRecipients: (...args: any[]) => resolveEmailRecipientsMock(...args),
}));

describe("add-compensatorio-request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendEmailMock.mockResolvedValue({ id: "mail-1" });
    resolveEmailRecipientsMock.mockImplementation((recipients: string | string[]) => recipients);
  });

  it("retorna error cuando no hay sesión", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any);

    const action = (await import("@/actions/add-compensatorio-request")).default;
    const result = await action({
      dob: new Date("2099-01-01"),
      hours: 2,
      time_start: "09:00",
      time_finish: "11:00",
    });

    expect(result).toEqual({ success: false, error: "No autenticado" });
  });

  it("retorna error cuando auth.getUser devuelve error", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("auth failed"),
        }),
      },
    } as any);

    const action = (await import("@/actions/add-compensatorio-request")).default;
    const result = await action({
      dob: new Date("2099-01-01"),
      hours: 2,
      time_start: "09:00",
      time_finish: "11:00",
    });

    expect(result).toEqual({ success: false, error: "No autenticado" });
  });

  it("acepta dob como Date (contrato del formulario) y registra la solicitud", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "user@test.com" } },
        }),
      },
      rpc: rpcMock,
    } as any);

    const action = (await import("@/actions/add-compensatorio-request")).default;
    const result = await action({
      dob: new Date("2099-01-20T00:00:00.000Z"),
      hours: 8,
      time_start: "09:00",
      time_finish: "18:00",
    });

    expect(result).toEqual({ success: true });
    expect(rpcMock).toHaveBeenCalledWith(
      "insert_compensatory_rest",
      expect.objectContaining({
        p_user_id: "user-1",
        p_t_time_start: "09:00",
        p_t_time_finish: "18:00",
        p_compensated_hours: 8,
      }),
    );
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(resolveEmailRecipientsMock).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/compensatorios/");
    expect(revalidatePath).toHaveBeenCalledWith("/compensatorios/request/");
  });

  it("usa destinatarios resueltos para respetar test mode/dedupe", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null });
    resolveEmailRecipientsMock.mockReturnValueOnce([
      "cmurillo@embperujapan.org",
      "sistema@embperujapan.org",
    ]);
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "cmurillo@embperujapan.org" } },
        }),
      },
      rpc: rpcMock,
    } as any);

    const action = (await import("@/actions/add-compensatorio-request")).default;
    const result = await action({
      dob: "2099-01-20",
      hours: 4,
      time_start: "09:00",
      time_finish: "13:00",
    });

    expect(result).toEqual({ success: true });
    expect(resolveEmailRecipientsMock).toHaveBeenCalledWith(
      expect.any(String),
      "cmurillo@embperujapan.org",
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["cmurillo@embperujapan.org", "sistema@embperujapan.org"],
      }),
    );
  });

  it("retorna error cuando la RPC falla y no envía email", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "rpc failed" },
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "user@test.com" } },
        }),
      },
      rpc: rpcMock,
    } as any);

    const action = (await import("@/actions/add-compensatorio-request")).default;
    const result = await action({
      dob: "2099-01-20",
      hours: 4,
      time_start: "09:00",
      time_finish: "13:00",
    });

    expect(result).toEqual({ success: false, error: "Error procesando solicitud" });
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rechaza horas inconsistentes antes de llamar al RPC", async () => {
    const rpcMock = vi.fn();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "user@test.com" } },
        }),
      },
      rpc: rpcMock,
    } as any);

    const action = (await import("@/actions/add-compensatorio-request")).default;
    const result = await action({
      dob: "2099-01-20",
      hours: 8,
      time_start: "09:00",
      time_finish: "13:00",
    });

    expect(result.success).toBe(false);
    expect((result as any).error).toContain("rango horario");
    expect(rpcMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("si falla email, conserva éxito de la solicitud y retorna warning", async () => {
    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null });
    sendEmailMock.mockRejectedValueOnce(new Error("email failed"));
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "user@test.com" } },
        }),
      },
      rpc: rpcMock,
    } as any);

    const action = (await import("@/actions/add-compensatorio-request")).default;
    const result = await action({
      dob: "2099-01-20",
      hours: 4,
      time_start: "09:00",
      time_finish: "13:00",
    });

    expect(result).toEqual({
      success: true,
      warning: "Solicitud registrada, pero falló el envío de email",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/compensatorios/");
    expect(revalidatePath).toHaveBeenCalledWith("/compensatorios/request/");
  });
});
