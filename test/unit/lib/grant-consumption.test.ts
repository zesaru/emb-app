import { describe, expect, it } from "vitest";

import { buildVacationGrantConsumptionPlan } from "@/lib/vacations/grant-consumption";

describe("buildVacationGrantConsumptionPlan", () => {
  it("consume primero el grant que expira antes", () => {
    const plan = buildVacationGrantConsumptionPlan(
      [
        {
          id: "grant-late",
          granted_on: "2025-07-01",
          expires_on: "2027-07-01",
          days_remaining: 8,
        },
        {
          id: "grant-soon",
          granted_on: "2024-07-01",
          expires_on: "2026-07-01",
          days_remaining: 4,
        },
      ],
      6,
      "2026-03-25",
    );

    expect(plan).toEqual({
      ok: true,
      allocations: [
        {
          grantId: "grant-soon",
          daysUsed: 4,
          resultingDaysRemaining: 0,
        },
        {
          grantId: "grant-late",
          daysUsed: 2,
          resultingDaysRemaining: 6,
        },
      ],
      totalConsumed: 6,
      remainingBalance: 6,
    });
  });

  it("ignora grants expirados y reporta saldo insuficiente", () => {
    const plan = buildVacationGrantConsumptionPlan(
      [
        {
          id: "grant-expired",
          granted_on: "2024-07-01",
          expires_on: "2025-03-25",
          days_remaining: 10,
        },
        {
          id: "grant-active",
          granted_on: "2025-07-01",
          expires_on: "2027-07-01",
          days_remaining: 2,
        },
      ],
      3,
      "2025-03-25",
    );

    expect(plan).toEqual({
      ok: false,
      reason: "insufficient_balance",
      availableDays: 2,
    });
  });
});
