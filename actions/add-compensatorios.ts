"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const addPost = async (formData: FormData) => {
  const eventName = formData.get("event_name");
  const hours = formData.get("hours");
  const eventDate = formData.get("event_date");
 
  if (formData === null) return;

  const supabase = createServerActionClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(user?.email);

  if (user === null) return;

  try {
    const result = await supabase
      .from("compensatorys")
      .insert({
        event_name: eventName,
        hours: hours,
        event_date: eventDate,
        user_id: user.id,
      }
    ).select('*')
    ;
    const email = user?.email;
    console.log(result);
    if (result.statusText === 'Created' && result.data) {

      const { id, hours, event_name, event_date } = result.data[0];

      try {
        const data = await resend.emails.send({
          from: "Team <team@peruinjapan.com>",
          to: `${email}`,
          subject: `Solicitud de Compensatorio del usuario(a) ${email}` ,
          //react: EmailTemplate({ hours, event_name, event_date}),
          text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú 
          en Japón ingrese al siguiente enlace para aprobar las solicitudes: https://emb-app.vercel.app/compensatorios/approvec/${id}`,
        })
        return { success: true, data }
      } catch (error) {
        console.log(error);
        return { success: false, error }
        
      }
    }
    revalidatePath(`/compensatorios/new`)
    return {
      success: true,
    }
    ;
  } catch (e) {
    return {
      error:e,  
    }
  }

    



};
