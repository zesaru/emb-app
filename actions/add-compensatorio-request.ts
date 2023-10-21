'use server';

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function UpdateCompensatorioResquest(compensatory: any) {
  const supabase = createServerActionClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const useridrequest = session?.user?.id;
  try {
    const result = await supabase
      .from("compensatorys")
      .insert({
        compensated_hours: compensatory.hours,
        user_id: useridrequest,
        t_time_start:compensatory.time_start,
        t_time_finish:compensatory.time_finish,
        compensated_hours_day:compensatory.dob
      })
      .select(`*`);


    try {
      const data = await resend.emails.send({
        from: "Team <team@peruinjapan.com>",
        to: `${ session?.user?.email}`,
        subject: `Aprobación de Compensatorio del usuario(a) ${ session?.user?.email}`,
        text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú en Japón para informarle se ha registrado su solicitud de compensatorio.`,
      });

      revalidatePath(`/compensatorios/request/`);
      return {
        success: true,
      }
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  } catch (error) {
    console.log(error);
  }
}