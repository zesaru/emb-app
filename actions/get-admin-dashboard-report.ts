import { createClient } from "@/utils/supabase/server";
import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { summarizeVacationGrantBalance } from "@/lib/vacations/grant-balance";
import { buildDashboardReport } from "@/lib/reporting/dashboard-metrics";
import { resolveJapanNextExpectedGrantDate } from "@/lib/vacations/japan-vacation-grants";

export async function getAdminDashboardReport() {
  await requireCurrentUserAdmin();
  const supabase = await createClient();

  const [usersResult, grantsResult, vacationsResult, compensatorysResult] = await Promise.all([
    supabase.from("users").select("id, name, email, hire_date").eq("is_active", true).eq("is_diplomatic", false),
    supabase.from("vacation_grants").select("user_id, granted_on, expires_on, days_granted, days_remaining, rule_type, notes"),
    supabase.from("vacations").select("id, created_at, start, finish, days, approve_request"),
    supabase.from("compensatorys").select("id, user_id, created_at, event_date, event_name, hours, compensated_hours, approve_request, final_approve_request, cancelled_at"),
  ]);

  if (usersResult.error || grantsResult.error || vacationsResult.error || compensatorysResult.error) {
    throw new Error("No se pudieron cargar las métricas del dashboard.");
  }

  const grantsByUser = new Map<string, Array<{
    granted_on: string;
    expires_on: string;
    days_granted: number;
    days_remaining: number;
    rule_type: "standard" | "proportional" | "manual" | null;
    notes: string | null;
  }>>();
  for (const grant of grantsResult.data ?? []) {
    const list = grantsByUser.get(grant.user_id) ?? [];
    list.push(grant);
    grantsByUser.set(grant.user_id, list);
  }

  const vacationBalance = (usersResult.data ?? []).reduce(
    (total, user) => total + summarizeVacationGrantBalance(grantsByUser.get(user.id) ?? []).totalRemaining,
    0,
  );
  const compensatoryHoursAvailable = (compensatorysResult.data ?? [])
    .filter((row) => row.event_name == null && row.final_approve_request == null && row.cancelled_at == null)
    .reduce((total, row) => total + Number(row.compensated_hours ?? 0), 0);

  const today = new Date().toISOString().slice(0, 10);
  const compensatoryByUser = new Map<string, { approved: number; used: number }>();
  for (const row of compensatorysResult.data ?? []) {
    if (!row.user_id || row.cancelled_at != null) continue;
    const summary = compensatoryByUser.get(row.user_id) ?? { approved: 0, used: 0 };
    if (row.approve_request === true) summary.approved += Number(row.hours ?? 0);
    summary.used += Number(row.compensated_hours ?? 0);
    compensatoryByUser.set(row.user_id, summary);
  }

  const employees = (usersResult.data ?? []).map((user) => {
    const grants = grantsByUser.get(user.id) ?? [];
    const balance = summarizeVacationGrantBalance(grants, today);
    const latestGrant = [...grants].sort((a, b) => b.granted_on.localeCompare(a.granted_on))[0];
    const compensation = compensatoryByUser.get(user.id) ?? { approved: 0, used: 0 };
    const daysUntilExpiry = balance.nextExpiryDate
      ? Math.ceil((new Date(`${balance.nextExpiryDate}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000)
      : null;

    return {
      id: user.id,
      name: user.name || "Sin nombre",
      email: user.email,
      hireDate: user.hire_date,
      vacationBalance: balance.totalRemaining,
      nextRenewalDate: user.hire_date
        ? resolveJapanNextExpectedGrantDate(user.hire_date, latestGrant ? {
          grantedOn: latestGrant.granted_on,
          ruleType: latestGrant.rule_type,
          notes: latestGrant.notes,
        } : null, today)
        : null,
      nextExpiryDate: balance.nextExpiryDate,
      compensatoryApprovedHours: compensation.approved,
      compensatoryAvailableHours: Math.max(0, compensation.approved - compensation.used),
      recommendation: daysUntilExpiry != null && daysUntilExpiry <= 90 && balance.totalRemaining > 0
        ? "urgent" as const
        : balance.totalRemaining >= 15
          ? "plan" as const
          : "healthy" as const,
    };
  }).sort((a, b) => {
    const priority = { urgent: 0, plan: 1, healthy: 2 };
    return priority[a.recommendation] - priority[b.recommendation] || b.vacationBalance - a.vacationBalance;
  });

  return buildDashboardReport({
    activeEmployees: usersResult.data?.length ?? 0,
    vacationBalance,
    compensatoryHoursAvailable,
    vacations: vacationsResult.data ?? [],
    compensatorys: compensatorysResult.data ?? [],
    employees,
  });
}
