"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { uuidSchema, positiveIntegerSchema } from "@/lib/validation/schemas";

const resend = new Resend(process.env.RESEND_API_KEY);

interface CompensatoryInput {
  id: string;
  user_id: string;
  email: string;
  hours: number;
}

export default async function updateApproveRegister(compensatory: CompensatoryInput) {
  const supabase = createClient();

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
      await resend.emails.send({
        from: "Team <team@peruinjapan.com>",
        to: compensatory.email,
        subject: `Solicitud de horas por compensatorio ${compensatory.email}`,
        text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú en Japón para informarle que, se ha aprobado su solicitud de registro de compensatorio.`,
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
