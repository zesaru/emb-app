"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { Resend } from 'resend';
import { format } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);
export const addVacation = async (data:any) => {
 
  if (data === null) return;

  const start = (format(data.start, 'yyyy-MM-dd'));
  const finish = (format(data.finish, 'yyyy-MM-dd'));

  const supabase = createServerActionClient({ cookies });
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