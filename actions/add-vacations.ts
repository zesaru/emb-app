"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { Resend } from 'resend';
import { format } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);
export const addVacation = async (data:any) => {
 

  const start = (format(data.start, 'yyyy-MM-dd'));
  const finish = (format(data.finish, 'yyyy-MM-dd'));

  if (data === null) return;
  const supabase = createServerActionClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) return;

  const user_id = user.id;

  try {
    const result = await supabase
    .from("vacations")
    .insert({
      start: start,
      finish: finish,
      days: data.days,
      id_user:user_id,
      request_date: new Date().toISOString(),
    }).select('*')

    const email = user?.email;
    const to = process.env.EMBPERUJAPAN_EMAIL;
    
    if (result.statusText === 'Created' && result.data) {

      try {
        const data = await resend.emails.send({
          from: "Team <team@peruinjapan.com>",
          to: `${to}`,
          subject: `Solicitud de Vacaciones del usuario(a) ${email}` ,
          text: `El siguiente email ha sido enviado desde la plataforma de vacaciones de la Embajada del Perú en Japón, ingrese al siguiente enlace para aprobar la solicitud de vacaciones -> https://emb-app.vercel.app/`,
        })
        return { success: true, data }
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