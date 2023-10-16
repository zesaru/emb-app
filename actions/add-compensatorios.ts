"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import { Resend } from 'resend';

const resendInstance = new Resend(process.env.RESEND_API_KEY);

export const addPost = async (formData: FormData) => {
  const eventName = formData.get("event_name");
  const hours = formData.get("hours");
  const eventDate = formData.get("event_date");
  if (formData === null) return;

  const supabase = createServerActionClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    )
    ;

    console.log(result)
    
    if (result.statusText === 'Created') {
      //const { name, email, message } = result.data
      try {
        const data = await resendInstance.emails.send({
          from: "Acme <onboarding@resend.dev>",
          to: 'webdev@embassyofperuinjapan.org',
          subject: 'Solicitud de Comepensatorio del usuario(a)' ,
          text: 'test',
        })
        return { success: true, data }
      } catch (error) {
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
