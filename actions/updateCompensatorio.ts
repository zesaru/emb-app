"use server";

import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { uuidSchema, positiveIntegerSchema } from "@/lib/validation/schemas";
import { CompensatorysWithUser } from "@/types/collections";
import { CompensatoryApprovedUser } from "@/components/email/templates/compensatory/compensatory-approved-user";
import { getFromEmail, buildUrl } from "@/components/email/utils/email-config";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function UpdateCompensatorio(compensatory: CompensatorysWithUser[]) {
  const supabase = await createClient();

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  // Verificar que sea admin - CRÍTICO PARA SEGURIDAD
  try {
    await requireCurrentUserAdmin();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "No autorizado" };
  }

  // Validar datos de entrada
  const compensatorio = compensatory[0];
  if (!compensatorio) {
    return { success: false, error: "Datos inválidos" };
  }

  // Validar que user1 existe
  if (!compensatorio.user1) {
    return { success: false, error: "Usuario no encontrado" };
  }

  try {
    uuidSchema.parse(compensatorio.id);
    // hours puede ser null, validar en ese caso
    const hours = Number(compensatorio.hours ?? 0);
    if (hours <= 0 || hours > 12) {
      return { success: false, error: "Horas deben estar entre 1 y 12" };
    }
    uuidSchema.parse(compensatorio.user1.id);
    const numCompensatorys = compensatorio.user1.num_compensatorys ?? 0;
    if (numCompensatorys < 0) {
      return { success: false, error: "Número de compensatorios inválido" };
    }
  } catch (error) {
    return { success: false, error: "Datos inválidos" };
  }

  const approveby = user.id;
  const hours = Number(compensatorio.hours ?? 0);
  const numCompensatorys = Number(compensatorio.user1.num_compensatorys ?? 0);

  try {
    // Actualizar compensatorio como aprobado
    const { error: updateError } = await supabase
      .from("compensatorys")
      .update({
        approve_request: true,
        approved_date: new Date().toISOString(),
        approved_by: approveby,
      })
      .eq("id", compensatorio.id)
      .select();

    if (updateError) {
      return { success: false, error: "Error al actualizar el registro" };
    }

    // Actualizar horas compensatorias del usuario
    const newCompensatoryHours = numCompensatorys + hours;
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

    // Enviar email de notificación
    try {
      await resend.emails.send({
        from: getFromEmail(),
        to: compensatorio.user1.email,
        subject: `¡Tu Solicitud Ha Sido Aprobada!`,
        react: React.createElement(CompensatoryApprovedUser, {
          userName: compensatorio.user1.email || 'Usuario',
          eventName: compensatorio.event_name || 'Registro de horas',
          hours: hours,
          eventDate: compensatorio.event_date || new Date().toISOString(),
          approvedDate: new Date().toISOString(),
          newTotalHours: newCompensatoryHours,
          dashboardUrl: buildUrl('/'),
        }),
      });
    } catch (emailError) {
      console.error("Error enviando email:", emailError);
      // No fallar la acción si el email falla
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
