import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.type";
import { vacationDate, vacationToday } from "@/lib/vacations/dates";
import {
  buildJapanVacationGrantDraft,
  getJapanNextGrantDate,
  resolveJapanDueGrantDate,
  resolveJapanUpcomingGrantDate,
  type GrantDraft,
} from "@/lib/vacations/japan-vacation-grants";

type User = Pick<Database["public"]["Tables"]["users"]["Row"],
  "id" | "hire_date" | "weekly_days" | "weekly_hours" | "attendance_eligible" |
  "grant_mode" | "is_active" | "is_diplomatic" | "num_vacations">;
type ExistingGrant = Pick<Database["public"]["Tables"]["vacation_grants"]["Row"],
  "user_id" | "granted_on" | "rule_type">;

type Plan =
  | { status: "ready"; grants: GrantDraft[] }
  | { status: "skipped" | "blocked"; reason: string };

function validDate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) && vacationDate(value) === value;
}

/** Plans only new entitlements after the last reconciled legal grant. Never edits balances. */
export function planAutomaticVacationGrants(user: User, history: ExistingGrant[], today: string): Plan {
  if (!user.is_active || user.is_diplomatic) return { status: "skipped", reason: "excluded_user" };
  if (user.grant_mode === "manual") return { status: "skipped", reason: "manual_mode" };
  if (user.grant_mode !== null && user.grant_mode !== "automatic") return { status: "blocked", reason: "invalid_mode" };
  if (user.attendance_eligible === false) return { status: "blocked", reason: "attendance_ineligible" };
  if (!validDate(user.hire_date) || !validDate(today)) return { status: "blocked", reason: "invalid_date" };

  const grants = history.filter(grant => grant.user_id === user.id);
  if (grants.some(grant => !validDate(grant.granted_on))) return { status: "blocked", reason: "invalid_history" };
  const legal = grants.filter(grant => grant.rule_type === "standard" || grant.rule_type === "proportional")
    .sort((a, b) => b.granted_on.localeCompare(a.granted_on));
  const latest = legal[0];

  // Manual cutovers may already include previous entitlements. They are never a
  // date from which we infer another grant or a new two-year expiration.
  if (grants.some(grant => grant.rule_type === "manual" && (!latest || grant.granted_on >= latest.granted_on))) {
    return { status: "blocked", reason: "reconciliation_required" };
  }
  if (!latest && Number(user.num_vacations ?? 0) > 0) return { status: "blocked", reason: "reconciliation_required" };
  if (grants.some(grant => !["manual", "standard", "proportional"].includes(grant.rule_type))) {
    return { status: "blocked", reason: "invalid_history" };
  }
  if (latest && (latest.granted_on > today || resolveJapanDueGrantDate(user.hire_date, latest.granted_on) !== latest.granted_on)) {
    return { status: "blocked", reason: "invalid_history" };
  }

  let grantedOn = resolveJapanUpcomingGrantDate(user.hire_date, latest?.granted_on);
  const pending: GrantDraft[] = [];
  while (grantedOn <= today) {
    const draft = buildJapanVacationGrantDraft({
      userId: user.id, hireDate: user.hire_date, grantedOn,
      weeklyDays: user.weekly_days, weeklyHours: user.weekly_hours,
      // Preserve the approved transitional attendance policy: explicit false blocks;
      // a pending review is documented rather than represented as a measured 80%.
      attendanceEligible: user.attendance_eligible ?? true,
      notes: `[auto:diario:${today}] Asignación por aniversario. Asistencia: ${user.attendance_eligible === true ? "elegibilidad confirmada" : "política transitoria; revisión pendiente"}.`,
    });
    if (!draft.ok) return { status: "blocked", reason: draft.reason };
    if (draft.grant.expires_on < today) return { status: "blocked", reason: "historical_gap" };
    pending.push(draft.grant);
    grantedOn = getJapanNextGrantDate(user.hire_date, grantedOn);
  }
  return pending.length > 0 ? { status: "ready", grants: pending } : { status: "skipped", reason: "up_to_date" };
}

const PAGE_SIZE = 500;

/** Server caller must verify CRON_SECRET before passing the privileged client. */
export async function runAutomaticVacationGrants(
  supabase: SupabaseClient<Database>,
  { now = new Date(), dryRun = false }: { now?: Date; dryRun?: boolean } = {},
) {
  const today = vacationToday(now);
  // Complete both reads before any write, so an unavailable page cannot result
  // in treating a partial history as an employee's complete balance.
  const users: User[] = [];
  const history: ExistingGrant[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from("users")
      .select("id, hire_date, weekly_days, weekly_hours, attendance_eligible, grant_mode, is_active, is_diplomatic, num_vacations")
      .eq("is_active", true).eq("is_diplomatic", false)
      .order("id", { ascending: true }).range(offset, offset + PAGE_SIZE - 1);
    if (error || !data) throw new Error("No se pudieron cargar todos los usuarios para asignar vacaciones");
    users.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from("vacation_grants")
      .select("user_id, granted_on, rule_type").order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error || !data) throw new Error("No se pudo cargar el historial completo de asignaciones");
    history.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  const byUser = new Map<string, ExistingGrant[]>();
  for (const grant of history) {
    const items = byUser.get(grant.user_id) ?? [];
    items.push(grant);
    byUser.set(grant.user_id, items);
  }
  const result = {
    success: true, dryRun, processedAt: today, issued: 0, wouldIssue: 0,
    skipped: 0, blocked: 0, duplicates: 0, failed: 0,
    reasons: {} as Record<string, number>,
  };
  for (const user of users) {
    const plan = planAutomaticVacationGrants(user, byUser.get(user.id) ?? [], today);
    if (plan.status !== "ready") {
      result[plan.status]++;
      result.reasons[plan.reason] = (result.reasons[plan.reason] ?? 0) + 1;
      continue;
    }
    result.wouldIssue += plan.grants.length;
    if (dryRun) continue;
    for (const grant of plan.grants) {
      const { error } = await supabase.from("vacation_grants").insert(grant);
      if (!error) result.issued++;
      else if (error.code === "23505") result.duplicates++;
      else {
        // Stop this employee's sequence; a retry resumes after the last successful
        // legal grant. No raw database messages or personal data enter the logs.
        result.failed++;
        result.success = false;
        break;
      }
    }
  }
  return result;
}
