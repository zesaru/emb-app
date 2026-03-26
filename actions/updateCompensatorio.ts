"use server";

import React from "react";
import { revalidatePath } from "next/cache";

import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { sendOrCaptureEmail } from "@/lib/email/dev-email-outbox";
import { uuidSchema } from "@/lib/validation/schemas";
import { CompensatorysWithUser } from "@/types/collections";
import { CompensatoryApprovedUser } from "@/components/email/templates/compensatory/compensatory-approved-user";
import { buildUrl } from "@/components/email/utils/email-config";
import { createClient } from "@/utils/supabase/server";

export default async function UpdateCompensatorio(compensatory: CompensatorysWithUser[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  try {
    await requireCurrentUserAdmin();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No autorizado" };
  }

  const compensatorio = compensatory[0];
  if (!compensatorio || !compensatorio.user1) {
    return { success: false, error: "Datos inválidos" };
  }

  try {
    uuidSchema.parse(compensatorio.id);
    uuidSchema.parse(compensatorio.user1.id);
    const hours = Number(compensatorio.hours ?? 0);
    if (hours <= 0 || hours > 12) {
      return { success: false, error: "Horas deben estar entre 1 y 12" };
    }
    const numCompensatorys = Number(compensatorio.user1.num_compensatorys ?? 0);
    if (numCompensatorys < 0) {
      return { success: false, error: "Número de compensatorios inválido" };
    }
  } catch {
    return { success: false, error: "Datos inválidos" };
  }

  const approvedBy = user.id;
  const hours = Number(compensatorio.hours ?? 0);
  const currentHours = Number(compensatorio.user1.num_compensatorys ?? 0);

  try {
    const { error: updateError } = await supabase
      .from("compensatorys")
      .update({
        approve_request: true,
        approved_date: new Date().toISOString(),
        approved_by: approvedBy,
      })
      .eq("id", compensatorio.id)
      .select();

    if (updateError) {
      return { success: false, error: "Error al actualizar el registro" };
    }

    const newCompensatoryHours = currentHours + hours;
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        num_compensatorys: newCompensatoryHours,
      })
      .eq("id", compensatorio.user1.id)
      .select();

    if (userUpdateError) {
      return { success: false, error: "Error al actualizar horas del usuario" };
    }

    try {
      await sendOrCaptureEmail({
        to: compensatorio.user1.email,
        subject: "Tu solicitud ha sido aprobada",
        templateName: "CompensatoryApprovedUser",
        triggeredByUserId: user.id,
        payload: {
          userName: compensatorio.user1.name || compensatorio.user1.email || "Usuario",
          eventName: compensatorio.event_name || "Registro de horas",
          hours,
          eventDate: compensatorio.event_date || new Date().toISOString(),
          approvedDate: new Date().toISOString(),
          newTotalHours: newCompensatoryHours,
          dashboardUrl: buildUrl("/"),
        },
        react: React.createElement(CompensatoryApprovedUser, {
          userName: compensatorio.user1.name || compensatorio.user1.email || "Usuario",
          eventName: compensatorio.event_name || "Registro de horas",
          hours,
          eventDate: compensatorio.event_date || new Date().toISOString(),
          approvedDate: new Date().toISOString(),
          newTotalHours: newCompensatoryHours,
          dashboardUrl: buildUrl("/"),
        }),
      });
    } catch (emailError) {
      console.error("Error enviando email:", emailError);
    }

    revalidatePath(`/compensatorios/approvec/${compensatorio.id}`);

    return { success: true };
  } catch (error) {
    console.error("Error en UpdateCompensatorio:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
