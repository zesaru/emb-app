'use server';

import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { formatInTimeZone } from 'date-fns-tz'

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Insert a new compensatory request into the database and send an email notification.
 * @param compensatory - An object containing the compensatory request data.
 * @returns An object with a success flag indicating if the operation was successful and an error object if the operation failed.
 */
export default async function UpdateCompensatorioResquest(compensatory: any) {
  const supabase = createClient();

  const fecha = formatInTimeZone(compensatory.dob, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ssXXX')
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const useridrequest = user?.id;

  try {

    await supabase.rpc("insert_compensatory_rest", { p_user_id: useridrequest, p_t_time_start: compensatory.time_start, p_t_time_finish: compensatory.time_finish, p_compensated_hours_day: fecha, p_compensated_hours: compensatory.hours });
    const email = process.env.EMBPERUJAPAN_EMAIL;
    try {
      const data = await resend.emails.send({
        from: "Team <team@peruinjapan.com>",
        to: `${email}`,
        subject: `Aprobación de Compensatorio del usuario(a) ${ user?.email}`,
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

