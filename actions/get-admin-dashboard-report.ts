import { createClient } from "@/utils/supabase/server";
import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { summarizeVacationGrantBalance } from "@/lib/vacations/grant-balance";
import { buildDashboardReport } from "@/lib/reporting/dashboard-metrics";

export async function getAdminDashboardReport() {
  await requireCurrentUserAdmin();
  const supabase = await createClient();

  const [usersResult, grantsResult, vacationsResult, compensatorysResult] = await Promise.all([
    supabase.from("users").select("id").eq("is_active", true).eq("is_diplomatic", false),
    supabase.from("vacation_grants").select("user_id, granted_on, expires_on, days_granted, days_remaining"),
    supabase.from("vacations").select("id, created_at, start, finish, days, approve_request"),
    supabase.from("compensatorys").select("id, created_at, event_date, event_name, hours, compensated_hours, approve_request, final_approve_request, cancelled_at"),
  ]);

  if (usersResult.error || grantsResult.error || vacationsResult.error || compensatorysResult.error) {
    throw new Error("No se pudieron cargar las métricas del dashboard.");
  }

  const grantsByUser = new Map<string, Array<{ granted_on: string; expires_on: string; days_granted: number; days_remaining: number }>>();
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

  return buildDashboardReport({
    activeEmployees: usersResult.data?.length ?? 0,
    vacationBalance,
    compensatoryHoursAvailable,
    vacations: vacationsResult.data ?? [],
    compensatorys: compensatorysResult.data ?? [],
  });
}
