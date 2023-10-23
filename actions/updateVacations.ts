"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export default async function UpdateVacations(vacations: any) {
  const supabase = createServerActionClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const approved_by = session?.user?.id;

  if (session === null) return;
  console.log(vacations);
  const result = await supabase
    .from("vacations")
    .update({
      approved_date: new Date(),
      approvedby: approved_by,
      
    })
    .eq("id", vacations.id)
    .select("*");
    console.log(result)
  //   await supabase
  //   .from("users")
  //   .update({
  //     num_vacationss: vacations.num_vacations - vacations.days,
  //   })
  //   .eq("id", vacations.user_id)
  //   .select(`*`);

//   try {
//     const data = await resend.emails.send({
//       from: "Team <team@peruinjapan.com>",
//       to: `${vacations.email}`,
//       subject: `Aprobacion de descanso  por compensatorio del usuario  ${vacations.email}`,
//       text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú en Japón para informarle que, se ha aprobado su solicitud de descanso por compensatorio.`,
//     });
//     revalidatePath(`/`);
//     return {
//       success: true,
//     };
//   } catch (error) {
//     console.log(error);
//   }
}
