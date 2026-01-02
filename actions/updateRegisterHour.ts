"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { compensatoryRegisterApprovalSchema } from "@/lib/validation/schemas";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function updateApproveRegisterHour(compensatory: any) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const approved_by = user?.id;

  if (user === null) {
    return { success: false, error: "No autenticado" };
  }

  // Validar datos de entrada con Zod
  try {
    compensatoryRegisterApprovalSchema.parse({
      id: compensatory.id,
      user_id: compensatory.user_id,
      email: compensatory.email,
      compensated_hours: compensatory.compensated_hours,
    });
  } catch (error: any) {
    return { success: false, error: error.errors?.[0]?.message || "Datos inválidos" };
  }

  await supabase
    .from("compensatorys")
    .update({
      final_approve_request: true,
      approved_by_compensated: approved_by,
    })
    .eq("id", compensatory.id)
    .select("*");

  await supabase.rpc("subtract_compensatory_hours", {
    hours: compensatory.compensated_hours,
    user_id: compensatory.user_id,
  });

  try {
    await resend.emails.send({
      from: "Team <team@peruinjapan.com>",
      to: `${compensatory.email}`,
      subject: `Aprobacion de descanso por compensatorio del usuario ${compensatory.email}`,
      text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú en Japón para informarle que, se ha aprobado su solicitud de descanso por compensatorio.`,
    });
    revalidatePath(`/`);
    return {
      success: true,
    };
  } catch (error) {
    // No exponer errores sensibles
    return { success: true };
  }
}
