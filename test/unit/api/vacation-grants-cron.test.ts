import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: vi.fn(), run: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: mocks.client }));
vi.mock("@/lib/vacations/automatic-grants", () => ({ runAutomaticVacationGrants: mocks.run }));
import { GET } from "@/app/api/cron/vacation-grants/route";

describe("retired Vercel vacation grant cron", () => {
  it("devuelve 410 sin abrir un cliente privilegiado ni emitir vacaciones", async () => {
    const response = await GET();
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      success: false,
      error: "La asignación automática de vacaciones se ejecuta en Supabase Cron",
    });
    expect(mocks.client).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });
});
