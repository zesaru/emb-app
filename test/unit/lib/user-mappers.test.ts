import { describe, expect, it } from "vitest";

import { normalizeUserRow, toUsersTableUpdate } from "@/lib/users/user-mappers";

describe("normalizeUserRow", () => {
  it("normaliza flags string a tipos usables por UI", () => {
    const result = normalizeUserRow({
      id: "123e4567-e89b-12d3-a456-426614174000",
      email: "user@example.com",
      name: "Test User",
      role: "user",
      admin: null,
      is_active: "false",
      num_vacations: "10",
      num_compensatorys: "3",
      created_at: "2026-02-25T10:00:00.000Z",
    });

    expect(result.isActive).toBe(false);
    expect(result.numVacations).toBe(10);
    expect(result.numCompensatorys).toBe(3);
    expect(result.role).toBe("user");
  });

  it("prioriza flag admin para rol efectivo", () => {
    const result = normalizeUserRow({
      id: "123e4567-e89b-12d3-a456-426614174000",
      email: "admin@example.com",
      admin: "admin",
      role: "user",
    });

    expect(result.role).toBe("admin");
    expect(result.admin).toBe("admin");
  });
});

describe("toUsersTableUpdate", () => {
  it("mapea role a role/admin e isActive a is_active", () => {
    const payload = toUsersTableUpdate({
      role: "admin",
      isActive: false,
      numVacations: 5,
      numCompensatorys: 2,
    });

    expect(payload).toMatchObject({
      role: "admin",
      admin: "admin",
      is_active: false,
      num_vacations: 5,
      num_compensatorys: 2,
    });
  });
});
