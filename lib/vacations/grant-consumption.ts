type ConsumableGrant = {
  id: string;
  granted_on: string;
  expires_on: string;
  days_remaining: number;
};

type GrantConsumptionAllocation = {
  grantId: string;
  daysUsed: number;
  resultingDaysRemaining: number;
};

type GrantConsumptionPlan =
  | {
      ok: true;
      allocations: GrantConsumptionAllocation[];
      totalConsumed: number;
      remainingBalance: number;
    }
  | {
      ok: false;
      reason: "insufficient_balance";
      availableDays: number;
    };

function parseIsoDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

export function buildVacationGrantConsumptionPlan(
  grants: ConsumableGrant[],
  requestedDays: number,
  asOfDate: string,
): GrantConsumptionPlan {
  const activeGrants = grants
    .filter((grant) => grant.days_remaining > 0 && parseIsoDate(grant.expires_on) > parseIsoDate(asOfDate))
    .sort((left, right) => {
      const expiresCompare = left.expires_on.localeCompare(right.expires_on);
      if (expiresCompare !== 0) return expiresCompare;
      return left.granted_on.localeCompare(right.granted_on);
    });

  const availableDays = activeGrants.reduce((sum, grant) => sum + grant.days_remaining, 0);
  if (availableDays < requestedDays) {
    return {
      ok: false,
      reason: "insufficient_balance",
      availableDays,
    };
  }

  let pendingDays = requestedDays;
  const allocations: GrantConsumptionAllocation[] = [];

  for (const grant of activeGrants) {
    if (pendingDays <= 0) break;

    const daysUsed = Math.min(grant.days_remaining, pendingDays);
    if (daysUsed <= 0) continue;

    allocations.push({
      grantId: grant.id,
      daysUsed,
      resultingDaysRemaining: grant.days_remaining - daysUsed,
    });

    pendingDays -= daysUsed;
  }

  return {
    ok: true,
    allocations,
    totalConsumed: requestedDays,
    remainingBalance: availableDays - requestedDays,
  };
}
