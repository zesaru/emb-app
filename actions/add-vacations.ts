"use server";

import { createClient } from "@/utils/supabase/server";
import { Resend } from 'resend';
import { formatInTimeZone } from "date-fns-tz";

const resend = new Resend(process.env.RESEND_API_KEY);
/**
 * Adds a vacation request to the server.
 *
 * @param data - The vacation request data.
 * @returns An object indicating the success or failure of the request.
 */
export const addVacation = async (data:any) => {

  if (data === null) return;

  const start =   formatInTimeZone(data.start, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ssXXX')

  const finish = formatInTimeZone(data.finish, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ssXXX')

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) return;

  const user_id = user.id;

  try {
    const result = await supabase
    .rpc('insertar_vacaciones', {
      p_start : start,
      p_finish : finish,
      p_days : data.days,
      p_id_user :user_id,
    })

    const to = process.env.EMBPERUJAPAN_EMAIL;
    if (result.statusText === 'OK' && result.data) {

      try {
        await resend.emails.send({
          from: "Team <team@peruinjapan.com>",
          to: `${to}`,
          subject: `Solicitud de Vacaciones del usuario(a) ${result.data[0].users_name }` ,
          text: `El señor(a) ${result.data[0].users_name } 
          ha solicitado vacaciones desde el ${start} hasta el ${finish} sumando un total de ${data.days} día(s).
          Por favor ingrese al siguiente enlace para aprobar la solicitud de vacaciones -> https://emb-app.vercel.app/`,
        })
        return { success: true }
      } catch (error) {
        console.log(error);
        return { success: false, error }
      }
    }
    return {
      success: true,
    }
    ;
  } catch (e) {
    return {
      error:e,  
    }
  }
}