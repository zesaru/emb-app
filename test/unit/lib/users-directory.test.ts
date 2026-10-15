import { describe, expect, it } from "vitest";
import { normalizeUserRow } from "@/lib/users/user-mappers";
import { assignmentLabel, expiresWithin90Days, userReviewReasons } from "@/lib/users/directory";
const user = normalizeUserRow({
  id: "one",
  name: "Persona",
  is_active: true,
  grant_mode: "manual",
  manual_next_grant_date: "2026-08-31",
});
describe("revisión del directorio", () => {
  it("presenta una fecha manual pasada como revisión, sin sustituirla por una inferencia", () => {
    expect(assignmentLabel(user, "2026-10-15")).toBe("Revisar fecha manual");
    expect(userReviewReasons(user, "2026-10-15")).toContain("Revisar fecha de asignación manual");
    expect(user.manualNextGrantDate).toBe("2026-08-31");
  });
  it("excluye diplomáticos de alertas laborales y de la próxima asignación", () => {
    expect(assignmentLabel({ ...user, isDiplomatic: true }, "2026-10-15")).toBe("No aplica");
    expect(userReviewReasons({ ...user, isDiplomatic: true }, "2026-10-15")).toEqual([]);
    expect(userReviewReasons({ ...user, isActive: false }, "2026-10-15")).toEqual([]);
  });
  it("incluye hoy y exactamente 90 días, excluye vencidos y el día 91", () => {
    expect(expiresWithin90Days("2026-10-15", "2026-10-15")).toBe(true);
    expect(expiresWithin90Days("2027-01-13", "2026-10-15")).toBe(true);
    expect(expiresWithin90Days("2027-01-14", "2026-10-15")).toBe(false);
    expect(expiresWithin90Days("2026-10-14", "2026-10-15")).toBe(false);
  });
});
