"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from 'resend';
import { compensatorySchema } from "@/lib/validation/schemas";

const resend = new Resend(process.env.RESEND_API_KEY);

export const addPost = async (formData: FormData) => {
  const eventName = formData.get("event_name");
  const hoursStr = formData.get("hours");
  const eventDate = formData.get("event_date");

  if (formData === null) return { success: false, error: "Datos vacíos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) return { success: false, error: "No autenticado" };

  // Validar y convertir horas a número
  const hours = Number(hoursStr);
  if (isNaN(hours) || hours <= 0 || hours > 12) {
    return { success: false, error: "Horas deben estar entre 1 y 12" };
  }

  // Validar datos con Zod
  try {
    compensatorySchema.parse({
      eventName,
      eventDate,
      hours,
    });
  } catch (error: any) {
    return { success: false, error: error.errors?.[0]?.message || "Datos inválidos" };
  }

  try {
    const result = await supabase
      .from("compensatorys")
      .insert({
        event_name: eventName,
        hours: hours,
        event_date: eventDate,
        user_id: user.id,
      }
    ).select('*');

    const email = process.env.EMBPERUJAPAN_EMAIL;

    if (result.statusText === 'Created' && result.data) {
      try {
        const data = await resend.emails.send({
          from: "Team <team@peruinjapan.com>",
          to: `${email}`,
          subject: `Solicitud de aprobación de registro de horas del usuario(a) ${user.email}`,
          text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú en Japón, ingrese al siguiente enlace para aprobar las solicitud de registro de horas https://emb-app.vercel.app/`,
        })
        return { success: true, data }
      } catch (error) {
        // No exponer errores sensibles
        return { success: true, data: result.data }
      }
    }
    revalidatePath(`/compensatorios/new`)
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      error: "Error creando registro",
    }
  }
};
