import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: vi.fn(), run: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: mocks.client }));
vi.mock("@/lib/vacations/automatic-grants", () => ({ runAutomaticVacationGrants: mocks.run }));
import { GET } from "@/app/api/cron/vacation-grants/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
  mocks.client.mockReturnValue({ client: "privileged" });
  mocks.run.mockResolvedValue({ success: true, issued: 1 });
});
afterEach(() => vi.unstubAllEnvs());

const request = (query = "", token = "test-cron-secret") => new Request(`http://localhost/api/cron/vacation-grants${query}`, {
  headers: { Authorization: `Bearer ${token}` },
});

describe("vacation grant cron", () => {
  it.each([["", 401], ["wrong-secret", 403]] as const)("impide acceder al cliente privilegiado con token %s", async (token, status) => {
    expect((await GET(request("", token))).status).toBe(status);
    expect(mocks.client).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it("ejecuta la asignación diaria autorizada", async () => {
    expect((await GET(request())).status).toBe(200);
    expect(mocks.run).toHaveBeenCalledWith({ client: "privileged" }, { dryRun: false });
  });
  it("permite consultar el plan sin modificaciones", async () => {
    await GET(request("?dryRun=true"));
    expect(mocks.run).toHaveBeenCalledWith({ client: "privileged" }, { dryRun: true });
  });
  it("responde 500 ante un fallo parcial de escritura", async () => {
    mocks.run.mockResolvedValue({ success: false, issued: 1, failed: 1 });
    expect((await GET(request())).status).toBe(500);
  });
  it("no convierte una lectura fallida en una cola vacía ni expone el error interno", async () => {
    mocks.run.mockRejectedValue(new Error("private database error"));
    const response = await GET(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error: "No se pudo completar la asignación automática de vacaciones" });
  });
});
