type VacationGrantBalanceItem = {
  granted_on: string;
  expires_on: string;
  days_granted: number;
  days_remaining: number;
};

export type VacationGrantBalanceSummary = {
  totalGranted: number;
  totalRemaining: number;
  totalExpiredRemaining: number;
  activeGrantCount: number;
  nextExpiryDate: string | null;
};

function parseIsoDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

export function summarizeVacationGrantBalance(
  grants: VacationGrantBalanceItem[],
  today = new Date().toISOString().slice(0, 10),
): VacationGrantBalanceSummary {
  const todayDate = parseIsoDate(today);

  let totalGranted = 0;
  let totalRemaining = 0;
  let totalExpiredRemaining = 0;
  let activeGrantCount = 0;
  let nextExpiryDate: string | null = null;

  for (const grant of grants) {
    totalGranted += Number(grant.days_granted ?? 0);

    const expiresOn = parseIsoDate(grant.expires_on);
    const remaining = Number(grant.days_remaining ?? 0);

    if (expiresOn > todayDate) {
      totalRemaining += remaining;
      activeGrantCount += 1;
      if (!nextExpiryDate || grant.expires_on < nextExpiryDate) {
        nextExpiryDate = grant.expires_on;
      }
    } else {
      totalExpiredRemaining += remaining;
    }
  }

  return {
    totalGranted,
    totalRemaining,
    totalExpiredRemaining,
    activeGrantCount,
    nextExpiryDate,
  };
}
