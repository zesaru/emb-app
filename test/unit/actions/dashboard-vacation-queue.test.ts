import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin, createClient } = vi.hoisted(() => ({ requireAdmin: vi.fn(), createClient: vi.fn() }));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("@/lib/auth/admin-check", () => ({ requireCurrentUserAdminAndActive: requireAdmin }));
vi.mock("@/utils/supabase/server", () => ({ createClient }));

import getVacationsNoapproved from "@/actions/getVacationsNoApproved";

describe("Cola de vacaciones del inicio", () => {
  beforeEach(() => { vi.clearAllMocks(); requireAdmin.mockResolvedValue("admin"); });

  it("incluye pendientes falsos y nulos, excluye cancelados y conserva la identidad para aprobar", async () => {
    const query = { select: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: "v1", id_user: "owner", approve_request: null,
        user1: { id: "owner", name: "Persona", email: "owner@example.test", num_vacations: 5 } }], error: null }) };
    createClient.mockResolvedValue({ from: vi.fn(() => query) });
    const rows = await getVacationsNoapproved();
    expect(query.or).toHaveBeenCalledWith("approve_request.eq.false,approve_request.is.null");
    expect(query.is).toHaveBeenCalledWith("cancelled_at", null);
    expect(rows[0]).toMatchObject({ id: "v1", user_id: "owner", user_name: "Persona", user1: { email: "owner@example.test" } });
  });

  it("no consulta datos sin un administrador activo", async () => {
    requireAdmin.mockRejectedValue(new Error("No autorizado"));
    await expect(getVacationsNoapproved()).rejects.toThrow("No autorizado");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("un error de lectura no se presenta como bandeja vacía", async () => {
    const query = { select: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: "private details" } }) };
    createClient.mockResolvedValue({ from: () => query });
    await expect(getVacationsNoapproved()).rejects.toThrow("No se pudieron cargar las vacaciones pendientes.");
  });
});
