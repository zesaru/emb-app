import { describe, expect, it } from "vitest";
import { buildCompensatoryReport, getReportTotals } from "@/lib/compensatorios/report";

const row = (overrides: Record<string, unknown> = {}) => ({
  user_id: "user-1",
  hours: 8,
  approve_request: true,
  compensated_hours: 2,
  user1: { name: "Akiko Uemise", email: "auemise@embperujapan.org" },
  ...overrides,
}) as any;

describe("compensatory report", () => {
  it("agrupa horas por usuario y calcula el saldo", () => {
    const rows = buildCompensatoryReport([row(), row({ hours: 4, compensated_hours: 1 }), row({ user_id: "user-2", approve_request: false, compensated_hours: 0, user1: { name: "Otra persona", email: "otra@example.com" } })]);

    expect(rows).toEqual([
      { userId: "user-1", name: "Akiko Uemise", email: "auemise@embperujapan.org", registeredHours: 12, approvedHours: 12, usedHours: 3, balance: 9 },
      { userId: "user-2", name: "Otra persona", email: "otra@example.com", registeredHours: 8, approvedHours: 0, usedHours: 0, balance: 0 },
    ]);
    expect(getReportTotals(rows)).toEqual({ registeredHours: 20, approvedHours: 12, usedHours: 3, balance: 9 });
  });
});
