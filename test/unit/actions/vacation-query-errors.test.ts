import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: mocks.createClient }));
import getVacationsWithUser from "@/actions/getVacationswithUser";

it("no presenta un fallo de base de datos como si no hubiera vacaciones", async () => {
  const q: any = {};
  for (const method of ["select", "eq", "gte"]) q[method] = () => q;
  q.order = () => Promise.resolve({ data: null, error: { message: "database unavailable" } });
  mocks.createClient.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: "own" } }, error: null }) }, from: () => q });
  await expect(getVacationsWithUser()).rejects.toThrow("No se pudieron cargar las vacaciones");
});
