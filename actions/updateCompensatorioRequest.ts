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
  const approveby = session?.user?.id;
  const compensatorio = compensatory[0];
  console.log(compensatory)
  try {
    // const result = await supabase
    //   .from("compensatorys")
    //   .update({
    //     approved_by_compensated: true,
    //     //compensated_hours_day: compensatorio.compensated_hours_day,
    //   })
    //   .eq("id", compensatorio.id)
    //   .select(`*`);

    // console.log(result)

    // await supabase
    //   .from("users")
    //   .update({
    //     num_compensatorys:
    //       compensatorio.user1.num_compensatorys + compensatorio.hours,
    //   })
    //   .eq("id", compensatorio.user1.id)
    //   .select(`*`);

    // try {
    //   const data = await resend.emails.send({
    //     from: "Team <team@peruinjapan.com>",
    //     to: `${ compensatorio.user1.email}`,
    //     subject: `Aprobación de Compensatorio del usuario(a) ${ compensatorio.user1.email}`,
    //     text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú en Japón para informarle se ha aprobado su solicitud de compensatorio.`,
    //   });

    //   revalidatePath(`/compensatorios/approvec/${compensatorio.id}`);
    // } catch (error) {
    //   console.log(error);
    //   return { success: false, error };
    // }
  } catch (error) {
    console.log(error);
  }
}
