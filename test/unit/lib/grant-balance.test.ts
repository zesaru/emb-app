import { describe, expect, it } from "vitest";

import { summarizeVacationGrantBalance } from "@/lib/vacations/grant-balance";

describe("summarizeVacationGrantBalance", () => {
  it("resume grants activos y expirados", () => {
    const summary = summarizeVacationGrantBalance(
      [
        {
          granted_on: "2024-07-01",
          expires_on: "2026-07-01",
          days_granted: 10,
          days_remaining: 6,
        },
        {
          granted_on: "2023-07-01",
          expires_on: "2025-07-01",
          days_granted: 11,
          days_remaining: 2,
        },
        {
          granted_on: "2021-07-01",
          expires_on: "2023-07-01",
          days_granted: 10,
          days_remaining: 1,
        },
      ],
      "2025-03-25",
    );

    expect(summary).toEqual({
      totalGranted: 31,
      totalRemaining: 8,
      totalExpiredRemaining: 1,
      activeGrantCount: 2,
      nextExpiryDate: "2025-07-01",
    });
  });

  it("ignora como activos los grants que ya expiraron exactamente en la fecha de corte", () => {
    const summary = summarizeVacationGrantBalance(
      [
        {
          granted_on: "2024-07-01",
          expires_on: "2025-03-25",
          days_granted: 10,
          days_remaining: 4,
        },
        {
          granted_on: "2025-01-01",
          expires_on: "2026-01-01",
          days_granted: 11,
          days_remaining: 11,
        },
      ],
      "2025-03-25",
    );

    expect(summary).toEqual({
      totalGranted: 21,
      totalRemaining: 11,
      totalExpiredRemaining: 4,
      activeGrantCount: 1,
      nextExpiryDate: "2026-01-01",
    });
  });
});
