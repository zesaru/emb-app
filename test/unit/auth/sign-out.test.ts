import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "@/app/auth/sign-out/route";

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), createClient: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: mocks.createClient }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.createClient.mockResolvedValue({ auth: { signOut: mocks.signOut } });
  mocks.signOut.mockResolvedValue({ error: null });
});
const request = (json = false, origin = "http://localhost:3000") => new Request("http://localhost:3000/auth/sign-out", {
  method: "POST", headers: { Origin: origin, ...(json ? { Accept: "application/json" } : {}) },
});

it("cierra únicamente la sesión actual y redirige el formulario con GET sin caché", async () => {
  const response = await POST(request());
  expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  expect(response.status).toBe(303);
  expect(response.headers.get("Location")).toBe("http://localhost:3000/login");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});
it("confirma el cierre al botón sin redirigir la solicitud fetch", async () => {
  const response = await POST(request(true));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ success: true });
});
it.each(["error", "exception"])("no anuncia éxito cuando Supabase falla: %s", async (failure) => {
  if (failure === "error") mocks.signOut.mockResolvedValue({ error: { message: "internal secret" } });
  else mocks.signOut.mockRejectedValue(new Error("internal secret"));
  const response = await POST(request(true));
  expect(response.status).toBe(503);
  expect(response.headers.get("Location")).toBeNull();
  expect(await response.text()).not.toContain("internal secret");
});
it("rechaza un cierre iniciado desde otro sitio antes de tocar la sesión", async () => {
  const response = await POST(request(true, "https://other.example"));
  expect(response.status).toBe(403);
  expect(mocks.createClient).not.toHaveBeenCalled();
});
