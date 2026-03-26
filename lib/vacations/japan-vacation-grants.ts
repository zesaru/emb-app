export const JAPAN_SERVICE_BANDS = [
  "6_months",
  "1_year_6_months",
  "2_years_6_months",
  "3_years_6_months",
  "4_years_6_months",
  "5_years_6_months",
  "6_years_6_months_plus",
] as const;

export type JapanServiceBand = typeof JAPAN_SERVICE_BANDS[number];
export type JapanVacationRuleType = "standard" | "proportional" | "manual";

type GrantDraftInput = {
  userId: string;
  hireDate: string;
  grantedOn: string;
  weeklyDays?: number | null;
  weeklyHours?: number | null;
  attendanceEligible?: boolean | null;
  ruleTypeOverride?: JapanVacationRuleType | null;
  notes?: string | null;
};

type GrantDraft = {
  user_id: string;
  granted_on: string;
  service_band: JapanServiceBand;
  days_granted: number;
  days_remaining: number;
  expires_on: string;
  rule_type: JapanVacationRuleType;
  notes: string | null;
};

type GrantDraftResult =
  | { ok: true; grant: GrantDraft }
  | {
      ok: false;
      reason:
        | "attendance_pending"
        | "attendance_ineligible"
        | "invalid_schedule"
        | "grant_before_eligibility";
    };

const STANDARD_GRANTS: Record<JapanServiceBand, number> = {
  "6_months": 10,
  "1_year_6_months": 11,
  "2_years_6_months": 12,
  "3_years_6_months": 14,
  "4_years_6_months": 16,
  "5_years_6_months": 18,
  "6_years_6_months_plus": 20,
};

const PROPORTIONAL_GRANTS: Record<1 | 2 | 3 | 4, Record<JapanServiceBand, number>> = {
  4: {
    "6_months": 7,
    "1_year_6_months": 8,
    "2_years_6_months": 9,
    "3_years_6_months": 10,
    "4_years_6_months": 12,
    "5_years_6_months": 13,
    "6_years_6_months_plus": 15,
  },
  3: {
    "6_months": 5,
    "1_year_6_months": 6,
    "2_years_6_months": 6,
    "3_years_6_months": 8,
    "4_years_6_months": 9,
    "5_years_6_months": 10,
    "6_years_6_months_plus": 11,
  },
  2: {
    "6_months": 3,
    "1_year_6_months": 4,
    "2_years_6_months": 4,
    "3_years_6_months": 5,
    "4_years_6_months": 6,
    "5_years_6_months": 6,
    "6_years_6_months_plus": 7,
  },
  1: {
    "6_months": 1,
    "1_year_6_months": 2,
    "2_years_6_months": 2,
    "3_years_6_months": 2,
    "4_years_6_months": 3,
    "5_years_6_months": 3,
    "6_years_6_months_plus": 3,
  },
};

const SERVICE_BAND_MONTHS: Array<{ band: JapanServiceBand; months: number }> = [
  { band: "6_months", months: 6 },
  { band: "1_year_6_months", months: 18 },
  { band: "2_years_6_months", months: 30 },
  { band: "3_years_6_months", months: 42 },
  { band: "4_years_6_months", months: 54 },
  { band: "5_years_6_months", months: 66 },
  { band: "6_years_6_months_plus", months: 78 },
];

function parseIsoDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addUtcMonths(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const result = new Date(Date.UTC(year, month + months, 1));
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function addUtcYears(date: Date, years: number) {
  return addUtcMonths(date, years * 12);
}

export function resolveJapanServiceBand(hireDate: string, grantedOn: string): JapanServiceBand | null {
  const hire = parseIsoDate(hireDate);
  const grant = parseIsoDate(grantedOn);

  let currentBand: JapanServiceBand | null = null;

  for (const entry of SERVICE_BAND_MONTHS) {
    const milestone = addUtcMonths(hire, entry.months);
    if (grant >= milestone) {
      currentBand = entry.band;
      continue;
    }
    break;
  }

  return currentBand;
}

export function getJapanNextGrantDate(hireDate: string, grantedOn: string) {
  return formatIsoDate(addUtcMonths(parseIsoDate(grantedOn), 12));
}

export function resolveJapanUpcomingGrantDate(hireDate: string, latestGrantedOn?: string | null) {
  if (!latestGrantedOn) {
    return formatIsoDate(addUtcMonths(parseIsoDate(hireDate), 6));
  }

  return getJapanNextGrantDate(hireDate, latestGrantedOn);
}

export function resolveJapanNextExpectedGrantDate(
  hireDate: string,
  latestGrantedOn?: string | null,
  referenceDate?: string | null,
) {
  const firstGrantDate = parseIsoDate(formatIsoDate(addUtcMonths(parseIsoDate(hireDate), 6)));

  if (latestGrantedOn) {
    return getJapanNextGrantDate(hireDate, latestGrantedOn);
  }

  const reference = referenceDate ? parseIsoDate(referenceDate) : new Date();
  let nextGrant = firstGrantDate;

  while (nextGrant < reference) {
    nextGrant = addUtcMonths(nextGrant, 12);
  }

  return formatIsoDate(nextGrant);
}

export function determineJapanVacationRuleType(input: {
  weeklyDays?: number | null;
  weeklyHours?: number | null;
  ruleTypeOverride?: JapanVacationRuleType | null;
}): JapanVacationRuleType | null {
  if (input.ruleTypeOverride) return input.ruleTypeOverride;

  const weeklyDays = input.weeklyDays ?? null;
  const weeklyHours = input.weeklyHours ?? null;

  if (weeklyDays == null && weeklyHours == null) return null;
  if ((weeklyDays ?? 0) >= 5 || (weeklyHours ?? 0) >= 30) return "standard";
  if (weeklyDays != null && weeklyDays >= 1 && weeklyDays <= 4) return "proportional";
  return null;
}

export function getJapanGrantedDays(input: {
  serviceBand: JapanServiceBand;
  ruleType: JapanVacationRuleType;
  weeklyDays?: number | null;
}) {
  if (input.ruleType === "manual") return null;
  if (input.ruleType === "standard") return STANDARD_GRANTS[input.serviceBand];

  const weeklyDays = input.weeklyDays ?? null;
  if (weeklyDays == null || weeklyDays < 1 || weeklyDays > 4) return null;

  return PROPORTIONAL_GRANTS[weeklyDays as 1 | 2 | 3 | 4][input.serviceBand];
}

export function buildJapanVacationGrantDraft(input: GrantDraftInput): GrantDraftResult {
  if (input.attendanceEligible == null) {
    return { ok: false, reason: "attendance_pending" };
  }

  if (input.attendanceEligible === false) {
    return { ok: false, reason: "attendance_ineligible" };
  }

  const serviceBand = resolveJapanServiceBand(input.hireDate, input.grantedOn);
  if (!serviceBand) {
    return { ok: false, reason: "grant_before_eligibility" };
  }

  const ruleType = determineJapanVacationRuleType({
    weeklyDays: input.weeklyDays,
    weeklyHours: input.weeklyHours,
    ruleTypeOverride: input.ruleTypeOverride,
  });

  if (!ruleType) {
    return { ok: false, reason: "invalid_schedule" };
  }

  const grantedDays = getJapanGrantedDays({
    serviceBand,
    ruleType,
    weeklyDays: input.weeklyDays,
  });

  if (grantedDays == null) {
    return { ok: false, reason: "invalid_schedule" };
  }

  return {
    ok: true,
    grant: {
      user_id: input.userId,
      granted_on: input.grantedOn,
      service_band: serviceBand,
      days_granted: grantedDays,
      days_remaining: grantedDays,
      expires_on: formatIsoDate(addUtcYears(parseIsoDate(input.grantedOn), 2)),
      rule_type: ruleType,
      notes: input.notes ?? null,
    },
  };
}
