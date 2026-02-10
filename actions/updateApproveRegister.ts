"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { uuidSchema, positiveIntegerSchema } from "@/lib/validation/schemas";
import { CompensatoryApprovedUser } from "@/components/email/templates/compensatory/compensatory-approved-user";
import { getFromEmail, buildUrl } from "@/components/email/utils/email-config";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

interface CompensatoryInput {
  id: string;
  user_id: string;
  email: string;
  hours: number;
}

export default async function updateApproveRegister(compensatory: CompensatoryInput) {
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
  try {
    uuidSchema.parse(compensatory.id);
    uuidSchema.parse(compensatory.user_id);
    positiveIntegerSchema.parse(compensatory.hours);
  } catch (error) {
    return { success: false, error: "Datos inválidos" };
  }

  const approved_by = user.id;

  try {
    // Actualizar compensatorio como aprobado
    const { data: updated, error: updateError } = await supabase
      .from("compensatorys")
      .update({
        approve_request: true,
        approved_date: new Date().toISOString(),
        approved_by: approved_by,
      })
      .eq("id", compensatory.id)
      .select("*")
      .single();

    if (updateError) {
      return { success: false, error: "Error al actualizar el registro" };
    }

    // Acumular horas compensatorias al usuario
    await supabase.rpc("accumulate_compensatory_hours", {
      hours: compensatory.hours,
      user_id: compensatory.user_id
    });

    // Enviar email de notificación
    try {
      // Fetch user data to get current compensatory hours
      const { data: userData } = await supabase
        .from("users")
        .select("num_compensatorys")
        .eq("id", compensatory.user_id)
        .single();

      const newTotalHours = userData?.num_compensatorys || 0;

      await resend.emails.send({
        from: getFromEmail(),
        to: compensatory.email,
        subject: `¡Tu Solicitud Ha Sido Aprobada!`,
        react: React.createElement(CompensatoryApprovedUser, {
          userName: compensatory.email,
          eventName: "Registro de horas",
          hours: compensatory.hours,
          eventDate: new Date().toISOString(),
          approvedDate: new Date().toISOString(),
          newTotalHours: newTotalHours,
          dashboardUrl: buildUrl('/'),
        }),
      });
    } catch (emailError) {
      console.error("Error enviando email:", emailError);
      // No fallar la acción si el email falla
    }

    revalidatePath("/");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Error en updateApproveRegister:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
