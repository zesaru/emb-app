"use server";

import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { requireCurrentUserAdmin } from "@/lib/auth/admin-check";
import { uuidSchema, positiveIntegerSchema } from "@/lib/validation/schemas";

const resend = new Resend(process.env.RESEND_API_KEY);

interface VacationInput {
  id: string;
  user_id: string;
  email: string;
  num_vacations: number;
  days: number;
}

export default async function UpdateVacations(vacations: VacationInput) {
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
    uuidSchema.parse(vacations.id);
    uuidSchema.parse(vacations.user_id);
    positiveIntegerSchema.parse(vacations.days);
    if (vacations.days < 1 || vacations.days > 30) {
      return { success: false, error: "Días debe estar entre 1 y 30" };
    }
    if (vacations.num_vacations < vacations.days) {
      return { success: false, error: "Usuario no tiene suficientes días de vacaciones" };
    }
  } catch (error) {
    return { success: false, error: "Datos inválidos" };
  }

  const approved_by = user.id;

  try {
    // Actualizar vacaciones como aprobadas
    const { error: updateError } = await supabase
      .from("vacations")
      .update({
        approved_date: new Date().toISOString(),
        approvedby: approved_by,
        approve_request: true,
      })
      .eq("id", vacations.id)
      .select();

    if (updateError) {
      return { success: false, error: "Error al actualizar el registro" };
    }

    // Actualizar días de vacaciones del usuario
    const newVacationDays = vacations.num_vacations - vacations.days;
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        num_vacations: newVacationDays,
      })
      .eq("id", vacations.user_id)
      .select();

    if (userUpdateError) {
      return { success: false, error: "Error al actualizar días del usuario" };
    }

    // Enviar email de notificación
    try {
      await resend.emails.send({
        from: "Team <team@peruinjapan.com>",
        to: vacations.email,
        subject: `Aprobación de uso de saldo vacacional ${vacations.email}`,
        text: `El siguiente email ha sido enviado desde la plataforma de vacaciones de la Embajada del Perú en Japón para informarle que, se ha aprobado su solicitud de vacaciones.`,
      });
    } catch (emailError) {
      console.error("Error enviando email:", emailError);
      // No fallar la acción si el email falla
    }

    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error en UpdateVacations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
