"use server";

import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY);
export default async function UpdateVacations(vacations: any) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const approved_by = user?.id;

  if (user === null) return;

    await supabase
    .from("vacations")
    .update({
      approved_date: new Date(),
      approvedby: approved_by,
      approve_request:true
    })
    .eq("id", vacations.id)
    .select("*");
    
    await supabase
    .from("users")
    .update({
      num_vacations: vacations.num_vacations - vacations.days,
    })
    .eq("id", vacations.user_id)
    .select(`*`);
  try {
    const data = await resend.emails.send({
      from: "Team <team@peruinjapan.com>",
      to: `${vacations.email}`,
      subject: `Aprobacion de usar su saldo vacacional ${vacations.email}`,
      text: `El siguiente email ha sido enviado desde la plataforma de vacaciones de la Embajada del Perú en Japón para informarle que, se ha aprobado su solicitud de vacaciones.`,
    });
    revalidatePath(`/`);
    return {
      success: true,
    };
  } catch (error) {
    console.log(error);
  }
}
