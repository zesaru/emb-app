import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyCronSecretMock = vi.fn();
const getSupabaseAdminClientMock = vi.fn();
const getActiveAdminEmailsMock = vi.fn();
const sendOrCaptureEmailMock = vi.fn();

vi.mock("@/lib/cron/verify-cron-secret", () => ({
  verifyCronSecret: (...args: any[]) => verifyCronSecretMock(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: (...args: any[]) => getSupabaseAdminClientMock(...args),
}));

vi.mock("@/lib/notifications/get-active-admin-emails", () => ({
  getActiveAdminEmails: (...args: any[]) => getActiveAdminEmailsMock(...args),
}));

vi.mock("@/lib/email/dev-email-outbox", () => ({
  sendOrCaptureEmail: (...args: any[]) => sendOrCaptureEmailMock(...args),
}));

const isEmailTestModeMock = vi.fn();
const resolveEmailRecipientsMock = vi.fn();

vi.mock("@/components/email/utils/email-config", () => ({
  buildUrl: (path: string) => `https://emb-app.vercel.app${path}`,
  isEmailTestMode: (...args: any[]) => isEmailTestModeMock(...args),
  resolveEmailRecipients: (...args: any[]) => resolveEmailRecipientsMock(...args),
}));

const FIVE_DAYS_AGO = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
const ONE_DAY_AGO = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

function mockRpcResults(results: { compensatorys: any[]; compensatoryHours: any[]; vacations: any[] }) {
  const rpcMock = vi.fn((fn: string) => {
    if (fn === "list_unapproved_compensatorys") {
      return Promise.resolve({ data: results.compensatorys, error: null });
    }
    if (fn === "list_hours_unapproved_compensatorys") {
      return Promise.resolve({ data: results.compensatoryHours, error: null });
    }
    if (fn === "list_unapproved_vacations") {
      return Promise.resolve({ data: results.vacations, error: null });
    }
    throw new Error(`unexpected rpc ${fn}`);
  });
  getSupabaseAdminClientMock.mockReturnValue({ rpc: rpcMock });
  return rpcMock;
}

describe("GET /api/cron/pending-approvals-reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyCronSecretMock.mockReturnValue({ authorized: true });
    sendOrCaptureEmailMock.mockResolvedValue({ success: true, deliveryMode: "sent" });
    isEmailTestModeMock.mockReturnValue(false);
    resolveEmailRecipientsMock.mockImplementation((recipients: string | string[]) => recipients);
  });

  it("rechaza si el CRON_SECRET no es válido", async () => {
    const forbiddenResponse = { status: 403 };
    verifyCronSecretMock.mockReturnValue({ authorized: false, response: forbiddenResponse });
    mockRpcResults({ compensatorys: [], compensatoryHours: [], vacations: [] });

    const { GET } = await import("@/app/api/cron/pending-approvals-reminder/route");
    const response = await GET(new Request("http://localhost/api/cron/pending-approvals-reminder"));

    expect(response).toBe(forbiddenResponse);
    expect(getActiveAdminEmailsMock).not.toHaveBeenCalled();
  });

  it("no envía nada si no hay solicitudes pendientes", async () => {
    mockRpcResults({ compensatorys: [], compensatoryHours: [], vacations: [] });

    const { GET } = await import("@/app/api/cron/pending-approvals-reminder/route");
    const response = await GET(new Request("http://localhost/api/cron/pending-approvals-reminder"));
    const body = await response.json();

    expect(body).toEqual({ sent: false, reason: "no pending requests older than 3 days" });
    expect(getActiveAdminEmailsMock).not.toHaveBeenCalled();
    expect(sendOrCaptureEmailMock).not.toHaveBeenCalled();
  });

  it("no envía nada si las solicitudes pendientes tienen menos de 3 días", async () => {
    mockRpcResults({
      compensatorys: [{ created_at: ONE_DAY_AGO, user_name: "Juan", email: "juan@test.com", hours: 8 }],
      compensatoryHours: [],
      vacations: [],
    });

    const { GET } = await import("@/app/api/cron/pending-approvals-reminder/route");
    const response = await GET(new Request("http://localhost/api/cron/pending-approvals-reminder"));
    const body = await response.json();

    expect(body).toEqual({ sent: false, reason: "no pending requests older than 3 days" });
    expect(getActiveAdminEmailsMock).not.toHaveBeenCalled();
    expect(sendOrCaptureEmailMock).not.toHaveBeenCalled();
  });

  it("envía un correo por cada admin activo cuando hay pendientes de más de 3 días", async () => {
    mockRpcResults({
      compensatorys: [
        { created_at: FIVE_DAYS_AGO, user_name: "Juan", email: "juan@test.com", hours: 8, event_name: "Feriado", event_date: "2026-08-01" },
      ],
      compensatoryHours: [],
      vacations: [
        { created_at: FIVE_DAYS_AGO, user_name: "Ana", email: "ana@test.com", start: "2026-08-10", finish: "2026-08-15", days: 5 },
      ],
    });
    getActiveAdminEmailsMock.mockResolvedValue(["admin1@test.com", "admin2@test.com"]);

    const { GET } = await import("@/app/api/cron/pending-approvals-reminder/route");
    const response = await GET(new Request("http://localhost/api/cron/pending-approvals-reminder"));
    const body = await response.json();

    expect(body).toEqual({
      sent: true,
      testMode: false,
      admins: 2,
      recipients: 2,
      counts: { compensatorys: 1, compensatoryHours: 0, vacations: 1, total: 2 },
    });
    expect(sendOrCaptureEmailMock).toHaveBeenCalledTimes(2);
    expect(sendOrCaptureEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "admin1@test.com", templateName: "PendingApprovalsReminder" }),
    );
    expect(sendOrCaptureEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "admin2@test.com", templateName: "PendingApprovalsReminder" }),
    );
  });

  it("en modo de prueba no envía a los admins reales, solo al destinatario de prueba", async () => {
    mockRpcResults({
      compensatorys: [{ created_at: FIVE_DAYS_AGO, user_name: "Juan", email: "juan@test.com", hours: 8 }],
      compensatoryHours: [],
      vacations: [],
    });
    getActiveAdminEmailsMock.mockResolvedValue(["admin1@test.com", "admin2@test.com", "admin3@test.com"]);
    isEmailTestModeMock.mockReturnValue(true);
    resolveEmailRecipientsMock.mockReturnValue(["tester@test.com", "sistema@embperujapan.org"]);

    const { GET } = await import("@/app/api/cron/pending-approvals-reminder/route");
    const response = await GET(new Request("http://localhost/api/cron/pending-approvals-reminder"));
    const body = await response.json();

    expect(body).toEqual({
      sent: true,
      testMode: true,
      admins: 3,
      recipients: 2,
      counts: { compensatorys: 1, compensatoryHours: 0, vacations: 0, total: 1 },
    });
    expect(sendOrCaptureEmailMock).toHaveBeenCalledTimes(2);
    expect(sendOrCaptureEmailMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: "admin1@test.com" }),
    );
    expect(sendOrCaptureEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "tester@test.com" }),
    );
  });
});
