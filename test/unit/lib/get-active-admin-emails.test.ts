import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseAdminClientMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: (...args: any[]) => getSupabaseAdminClientMock(...args),
}));

function makeUsersClient(rows: unknown[]) {
  const selectMock = vi.fn().mockResolvedValue({ data: rows, error: null });
  const fromMock = vi.fn(() => ({ select: selectMock }));
  return { from: fromMock, __mocks: { fromMock, selectMock } };
}

describe("getActiveAdminEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("incluye admins y super_admins activos, excluye usuarios normales", async () => {
    getSupabaseAdminClientMock.mockReturnValue(
      makeUsersClient([
        { id: "1", email: "admin@test.com", admin: "admin", role: "admin", is_active: true },
        { id: "2", email: "super@test.com", admin: "admin", role: "super_admin", is_active: true },
        { id: "3", email: "user@test.com", admin: null, role: "user", is_active: true },
      ]),
    );

    const { getActiveAdminEmails } = await import("@/lib/notifications/get-active-admin-emails");
    const result = await getActiveAdminEmails();

    expect(result.sort()).toEqual(["admin@test.com", "super@test.com"]);
  });

  it("excluye admins inactivos", async () => {
    getSupabaseAdminClientMock.mockReturnValue(
      makeUsersClient([
        { id: "1", email: "active-admin@test.com", admin: "admin", role: "admin", is_active: true },
        { id: "2", email: "inactive-admin@test.com", admin: "admin", role: "admin", is_active: false },
      ]),
    );

    const { getActiveAdminEmails } = await import("@/lib/notifications/get-active-admin-emails");
    const result = await getActiveAdminEmails();

    expect(result).toEqual(["active-admin@test.com"]);
  });

  it("lanza error si la consulta falla", async () => {
    const client = makeUsersClient([]);
    client.__mocks.selectMock.mockResolvedValue({ data: null, error: { message: "db error" } });
    getSupabaseAdminClientMock.mockReturnValue(client);

    const { getActiveAdminEmails } = await import("@/lib/notifications/get-active-admin-emails");
    await expect(getActiveAdminEmails()).rejects.toThrow("No se pudo obtener la lista de administradores");
  });
});
