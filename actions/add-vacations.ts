"use server";

import { createClient } from "@/utils/supabase/server";
import { Resend } from 'resend';
import { formatInTimeZone } from "date-fns-tz";
import { vacationSchema } from "@/lib/validation/schemas";

const resend = new Resend(process.env.RESEND_API_KEY);
/**
 * Adds a vacation request to the server.
 *
 * @param data - The vacation request data.
 * @returns An object indicating the success or failure of the request.
 */
export const addVacation = async (data: any) => {

  if (data === null) return { success: false, error: "Datos vacíos" };

  // Validar datos con Zod
  try {
    vacationSchema.parse(data);
  } catch (error: any) {
    return { success: false, error: error.errors?.[0]?.message || "Datos inválidos" };
  }

  // Validaciones adicionales
  if (data.days <= 0 || data.days > 30) {
    return { success: false, error: "Días deben estar entre 1 y 30" };
  }

  const start = formatInTimeZone(data.start, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ssXXX');
  const finish = formatInTimeZone(data.finish, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ssXXX');

  // Validar que la fecha de fin sea posterior a la de inicio
  if (new Date(data.finish) <= new Date(data.start)) {
    return { success: false, error: "La fecha de fin debe ser posterior a la de inicio" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) return { success: false, error: "No autenticado" };

  const user_id = user.id;

  try {
    const result = await supabase
    .rpc('insertar_vacaciones', {
      p_start: start,
      p_finish: finish,
      p_days: data.days,
      p_id_user: user_id,
    });

    const to = process.env.EMBPERUJAPAN_EMAIL;
    if (result.statusText === 'OK' && result.data) {
      try {
        await resend.emails.send({
          from: "Team <team@peruinjapan.com>",
          to: `${to}`,
          subject: `Solicitud de Vacaciones del usuario(a) ${result.data[0].users_name}`,
          text: `El señor(a) ${result.data[0].users_name}
          ha solicitado vacaciones desde el ${start} hasta el ${finish} sumando un total de ${data.days} día(s).
          Por favor ingrese al siguiente enlace para aprobar la solicitud de vacaciones -> https://emb-app.vercel.app/`,
        })
        return { success: true }
      } catch (error) {
        // No exponer errores sensibles
        return { success: true }
      }
    }
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      error: "Error procesando solicitud",
    }
  }
}