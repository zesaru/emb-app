import { NextResponse } from "next/server";

import { verifyCronSecret } from "@/lib/cron/verify-cron-secret";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildJapanVacationGrantDraft,
  resolveJapanDueGrantDate,
} from "@/lib/vacations/japan-vacation-grants";

export const dynamic = "force-dynamic";

function isEvenIsoWeek(date: Date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7) % 2 === 0;
}

/**
 * Quincenalmente emite un único grant legal vencido por usuario. Los registros
 * se identifican en notes y la ruta nunca emite un grant futuro o duplicado.
 */
export async function GET(request: Request) {
  const verification = verifyCronSecret(request);
  if (!verification.authorized) return verification.response;

  const now = new Date();
  if (!isEvenIsoWeek(now)) return NextResponse.json({ skipped: true, reason: "off_week" });

  const today = now.toISOString().slice(0, 10);
  const supabase = getSupabaseAdminClient();
  const [usersResult, grantsResult] = await Promise.all([
    supabase.from("users").select("id, hire_date, weekly_days, weekly_hours, attendance_eligible, grant_mode").eq("is_active", true).eq("is_diplomatic", false),
    supabase.from("vacation_grants").select("user_id, granted_on, rule_type, notes").order("granted_on", { ascending: false }),
  ]);

  if (usersResult.error || grantsResult.error) {
    return NextResponse.json({ success: false, error: "No se pudo cargar la cola de grants" }, { status: 500 });
  }

  const grantDatesByUser = new Map<string, Set<string>>();
  for (const grant of grantsResult.data ?? []) {
    const grantDates = grantDatesByUser.get(grant.user_id) ?? new Set<string>();
    grantDates.add(grant.granted_on);
    grantDatesByUser.set(grant.user_id, grantDates);
  }

  let issued = 0;
  let skipped = 0;
  for (const user of usersResult.data ?? []) {
    if (!user.hire_date || user.grant_mode === "manual" || user.attendance_eligible === false) { skipped++; continue; }
    const grantedOn = resolveJapanDueGrantDate(user.hire_date, today);
    if (!grantedOn || grantDatesByUser.get(user.id)?.has(grantedOn)) { skipped++; continue; }

    const draft = buildJapanVacationGrantDraft({
      userId: user.id, hireDate: user.hire_date, grantedOn,
      weeklyDays: user.weekly_days, weeklyHours: user.weekly_hours,
      attendanceEligible: true, notes: `[auto:quincenal:${today}]`,
    });
    if (!draft.ok) { skipped++; continue; }

    const { error } = await supabase.from("vacation_grants").insert(draft.grant as any);
    if (error) {
      if (error.code !== "23505") console.error("vacation grant cron insert failed", user.id, error.message);
      skipped++;
    } else issued++;
  }

  return NextResponse.json({ success: true, issued, skipped, processedAt: today });
}
