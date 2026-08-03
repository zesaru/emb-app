import { NextResponse } from "next/server";
import React from "react";

import { verifyCronSecret } from "@/lib/cron/verify-cron-secret";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getActiveAdminEmails } from "@/lib/notifications/get-active-admin-emails";
import { sendOrCaptureEmail } from "@/lib/email/dev-email-outbox";
import { buildUrl } from "@/components/email/utils/email-config";
import PendingApprovalsReminder, {
  type PendingApprovalsCategory,
} from "@/components/email/templates/system/pending-approvals-reminder";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/pending-approvals-reminder
 * Recordatorio diario a admins/super_admins activos con las solicitudes
 * de compensatorios/vacaciones que siguen pendientes de aprobar. No manda
 * nada si no hay ninguna pendiente. Invocada por Vercel Cron (vercel.json).
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

    const compensatorys = (compensatorysResult.data as any[]) || [];
    const compensatoryHours = (compensatoryHoursResult.data as any[]) || [];
    const vacations = (vacationsResult.data as any[]) || [];

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
      return NextResponse.json({ sent: false, reason: "no pending requests" });
    }

    const adminEmails = await getActiveAdminEmails();
    const dashboardUrl = buildUrl("/");

    for (const email of adminEmails) {
      await sendOrCaptureEmail({
        to: email,
        subject: `Recordatorio: ${totalCount} solicitud${totalCount === 1 ? "" : "es"} pendiente${totalCount === 1 ? "" : "s"} de aprobar`,
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
      admins: adminEmails.length,
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
