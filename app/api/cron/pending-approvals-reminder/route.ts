import { NextResponse } from "next/server";
import React from "react";

import { verifyCronSecret } from "@/lib/cron/verify-cron-secret";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getActiveAdminEmails } from "@/lib/notifications/get-active-admin-emails";
import { sendOrCaptureEmail } from "@/lib/email/dev-email-outbox";
import { buildUrl, isEmailTestMode, resolveEmailRecipients } from "@/components/email/utils/email-config";
import PendingApprovalsReminder, {
  type PendingApprovalsCategory,
} from "@/components/email/templates/system/pending-approvals-reminder";

export const dynamic = "force-dynamic";

const STALE_AFTER_DAYS = 3;

function isStale(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs >= STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * GET /api/cron/pending-approvals-reminder
 * Recordatorio diario a admins/super_admins activos con las solicitudes
 * de compensatorios/vacaciones que llevan más de 3 días esperando
 * aprobación. No manda nada si no hay ninguna solicitud tan atrasada.
 * Invocada por Vercel Cron (vercel.json).
 */
export async function GET(request: Request) {
  const verification = verifyCronSecret(request);
  if (!verification.authorized) {
    return verification.response;
  }

  try {
    const supabase = getSupabaseAdminClient();

    const [compensatorysResult, compensatoryHoursResult, vacationsResult] = await Promise.all([
      supabase.rpc("list_unapproved_compensatorys"),
      supabase.rpc("list_hours_unapproved_compensatorys"),
      supabase.rpc("list_unapproved_vacations"),
    ]);

    const compensatorys = ((compensatorysResult.data as any[]) || []).filter((row) => isStale(row.created_at));
    const compensatoryHours = ((compensatoryHoursResult.data as any[]) || []).filter((row) => isStale(row.created_at));
    const vacations = ((vacationsResult.data as any[]) || []).filter((row) => isStale(row.created_at));

    const categories: PendingApprovalsCategory[] = [
      {
        label: "Compensatorios por aprobar",
        count: compensatorys.length,
        items: compensatorys.map((row) => ({
          name: row.user_name || row.email || "Sin nombre",
          detail: `${row.hours ?? 0}h - ${row.event_name || row.event_date || "sin fecha"}`,
        })),
      },
      {
        label: "Descansos por compensatorio por aprobar",
        count: compensatoryHours.length,
        items: compensatoryHours.map((row) => ({
          name: row.user_name || row.email || "Sin nombre",
          detail: `${row.compensated_hours ?? 0}h - ${row.compensated_hours_day || "sin fecha"}`,
        })),
      },
      {
        label: "Vacaciones por aprobar",
        count: vacations.length,
        items: vacations.map((row) => ({
          name: row.user_name || row.email || "Sin nombre",
          detail: `${row.start || "?"} - ${row.finish || "?"} (${row.days ?? 0} días)`,
        })),
      },
    ];

    const totalCount = categories.reduce((sum, category) => sum + category.count, 0);

    if (totalCount === 0) {
      return NextResponse.json({ sent: false, reason: "no pending requests older than 3 days" });
    }

    const realAdminEmails = await getActiveAdminEmails();

    // En EMAIL_TEST_MODE, no le mandamos el recordatorio a los admins reales:
    // resolveEmailRecipients lo colapsa a EMAIL_TEST_USER + el correo de
    // sistema, igual que ya hacen las notificaciones de compensatorios/
    // vacaciones. Así se puede probar el endpoint en vivo sin spamear a
    // todo el equipo de administradores.
    const resolvedRecipients = resolveEmailRecipients(realAdminEmails);
    const recipientEmails = Array.isArray(resolvedRecipients) ? resolvedRecipients : [resolvedRecipients];

    const dashboardUrl = buildUrl("/");

    for (const email of recipientEmails) {
      if (!email) continue;
      await sendOrCaptureEmail({
        to: email,
        subject: `Recordatorio amistoso: ${totalCount} solicitud${totalCount === 1 ? "" : "es"} pendiente${totalCount === 1 ? "" : "s"} de aprobar`,
        templateName: "PendingApprovalsReminder",
        triggeredByUserId: null,
        react: React.createElement(PendingApprovalsReminder, {
          categories,
          totalCount,
          dashboardUrl,
        }),
      });
    }

    return NextResponse.json({
      sent: true,
      testMode: isEmailTestMode(),
      admins: realAdminEmails.length,
      recipients: recipientEmails.length,
      counts: {
        compensatorys: compensatorys.length,
        compensatoryHours: compensatoryHours.length,
        vacations: vacations.length,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("pending-approvals-reminder cron failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
