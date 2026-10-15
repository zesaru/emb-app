import { vacationDate, vacationToday } from "@/lib/vacations/dates";
import { resolveJapanNextExpectedGrantDate } from "@/lib/vacations/japan-vacation-grants";
import type { VacationGrantHistoryItem } from "@/lib/vacations/grant-history";

export type ReportPeriod = { from: string; to: string };
export type ReportUser = {
  id: string;
  name: string | null;
  email: string;
  position: string | null;
  is_active: boolean | null;
  is_diplomatic: boolean;
  hire_date: string | null;
  grant_mode: string | null;
  manual_next_grant_date: string | null;
};
export type ReportGrant = Omit<VacationGrantHistoryItem, "consumptions" | "service_band"> & {
  user_id: string;
};
export type ReportVacation = {
  id: string;
  id_user: string | null;
  start: string | null;
  finish: string | null;
  days: number | null;
  approve_request: boolean | null;
  cancelled_at: string | null;
  request_date: string | null;
};
export type ReportCompensatory = {
  id: string;
  user_id: string | null;
  event_name: string | null;
  hours: number | null;
  compensated_hours: number | null;
  approve_request: boolean | null;
  cancelled_at: string | null;
};
export type ExpirationBucket = { date: string; days: number };
export type StaffReportEmployee = {
  id: string;
  name: string;
  email: string;
  position: string | null;
  active: boolean;
  diplomatic: boolean;
  hireDate: string | null;
  mode: "manual" | "automatic";
  nextGrantDate: string | null;
  balance: number;
  expirations: ExpirationBucket[];
  special: boolean;
  pendingRequests: number;
  approvedDays: number;
  approvedRequests: number;
  activeToday: boolean;
  compensatoryHours: number;
  compensatoryReservedHours: number;
};
export type StaffReport = {
  generatedAt: string;
  today: string;
  period: ReportPeriod;
  employees: StaffReportEmployee[];
};
export type IndividualStaffReport = {
  generatedAt: string;
  today: string;
  period: ReportPeriod;
  employee: StaffReportEmployee;
  vacations: ReportVacation[];
  grants: VacationGrantHistoryItem[];
};
export function defaultReportPeriod(now = new Date()): ReportPeriod {
  const year = vacationToday(now).slice(0, 4);
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}
export function validateReportPeriod(period: ReportPeriod): ReportPeriod {
  if (
    !period ||
    !/^\d{4}-\d{2}-\d{2}$/.test(period.from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(period.to) ||
    vacationDate(period.from) !== period.from ||
    vacationDate(period.to) !== period.to ||
    period.from > period.to
  ) {
    throw new Error(
      "Selecciona un período válido: la fecha inicial debe ser anterior o igual a la final.",
    );
  }
  return { from: period.from, to: period.to };
}
// Periods include overlapping vacations. The original recorded days are shown in full.
export function vacationInPeriod(row: ReportVacation, period: ReportPeriod) {
  const start = vacationDate(row.start),
    finish = vacationDate(row.finish);
  if (start) return start <= period.to && (finish ?? start) >= period.from;
  const requested = vacationDate(row.request_date);
  return !!requested && requested >= period.from && requested <= period.to;
}
export function vacationReportStatus(row: ReportVacation, today: string) {
  if (row.cancelled_at || Number(row.days) < 0) return "Cancelada";
  if (row.approve_request !== true) return "Pendiente";
  const start = vacationDate(row.start),
    finish = vacationDate(row.finish);
  if (!start || !finish) return "Aprobada · fechas incompletas";
  if (finish < today) return "Disfrutada";
  if (start > today) return "Programada";
  return "En curso";
}
export function isExpiringSoon(date: string, today: string) {
  const difference =
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000;
  return difference >= 0 && difference <= 90;
}
export function availableGrantBuckets(grants: ReportGrant[], today: string): ExpirationBucket[] {
  const grouped = new Map<string, number>();
  for (const grant of grants) {
    if (
      grant.granted_on <= today &&
      grant.expires_on >= today &&
      Number(grant.days_remaining) > 0
    ) {
      grouped.set(
        grant.expires_on,
        (grouped.get(grant.expires_on) ?? 0) + Number(grant.days_remaining),
      );
    }
  }
  return Array.from(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, days]) => ({ date, days }));
}
export function buildStaffReport(input: {
  users: ReportUser[];
  grants: ReportGrant[];
  vacations: ReportVacation[];
  compensatory: ReportCompensatory[];
  period: ReportPeriod;
  now?: Date;
}): StaffReport {
  const now = input.now ?? new Date(),
    today = vacationToday(now);
  const period = validateReportPeriod(input.period);
  const employees = input.users
    .filter((user) => user.is_diplomatic === false)
    .map((user): StaffReportEmployee => {
      const grants = input.grants.filter((grant) => grant.user_id === user.id);
      const latest = [...grants].sort(
        (a, b) => b.granted_on.localeCompare(a.granted_on) || b.id.localeCompare(a.id),
      )[0];
      const expirations = user.is_diplomatic ? [] : availableGrantBuckets(grants, today);
      const vacations = input.vacations.filter(
        (row) => row.id_user === user.id && vacationInPeriod(row, period),
      );
      const valid = vacations.filter((row) => !row.cancelled_at && Number(row.days) >= 0);
      const approved = valid.filter((row) => row.approve_request === true);
      const compensation = input.compensatory.filter(
        (row) => row.user_id === user.id && !row.cancelled_at,
      );
      const earned = compensation
        .filter((row) => row.event_name != null && row.approve_request === true)
        .reduce((sum, row) => sum + Number(row.hours ?? 0), 0);
      // Pending rests already reserve hours in the existing application flow.
      const reserved = compensation
        .filter((row) => row.event_name == null)
        .reduce((sum, row) => sum + Number(row.compensated_hours ?? 0), 0);
      return {
        id: user.id,
        name: user.name || "Sin nombre",
        email: user.email,
        position: user.position,
        active: user.is_active !== false,
        diplomatic: user.is_diplomatic,
        hireDate: user.hire_date,
        mode: user.grant_mode === "manual" ? "manual" : "automatic",
        nextGrantDate: user.is_diplomatic
          ? null
          : user.grant_mode === "manual"
            ? user.manual_next_grant_date
            : user.hire_date
              ? resolveJapanNextExpectedGrantDate(
                  user.hire_date,
                  latest
                    ? {
                        grantedOn: latest.granted_on,
                        ruleType: latest.rule_type,
                        notes: latest.notes,
                      }
                    : null,
                  today,
                )
              : null,
        balance: expirations.reduce((sum, item) => sum + item.days, 0),
        expirations,
        special: grants.some(
          (g) =>
            g.rule_type === "manual" &&
            g.granted_on <= today &&
            g.expires_on >= today &&
            Number(g.days_remaining) > 0 &&
            /caso especial/i.test(g.notes ?? ""),
        ),
        pendingRequests: valid.filter((row) => row.approve_request !== true).length,
        approvedDays: approved.reduce((sum, row) => sum + Number(row.days ?? 0), 0),
        approvedRequests: approved.length,
        activeToday: input.vacations.some(
          (row) => row.id_user === user.id && vacationReportStatus(row, today) === "En curso",
        ),
        compensatoryHours: earned - reserved,
        compensatoryReservedHours: reserved,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es") || a.id.localeCompare(b.id));
  return { generatedAt: now.toISOString(), today, period, employees };
}
