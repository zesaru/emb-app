import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function UpdateCompensatorio(
  id: string,
  approved_by: string
) {
  const supabase = createServerActionClient({ cookies });
  try {
    const AprobarCompensatorio = await supabase
      .from("compensatorys")
      .update({
        approve_request: true,
        approved_date: new Date(),
        approved_by: approved_by,
      })
      .eq("id", id)
      .select(`*`);

      const email = 'cmurillo@embperujapan.org'
      try {
        const data = await resend.emails.send({
          from: "Team <team@peruinjapan.com>",
          to: `${email}`,
          subject: `Aprobación de Compensatorio del usuario(a) ${email}` ,
          text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú 
          en Japón para informarle que el usuario(a) ${email} ha aprobado su solicitud de compensatorio.`,
        })
        return { success: true, data }
      } catch (error) {
        console.log(error);
        return { success: false, error }
        
      }
  } catch (error) {
    console.log(error);
  }
}
