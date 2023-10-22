"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export default async function updateApproveRegister(compensatory: any) {
  const supabase = createServerActionClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const approved_by = session?.user?.id;
  console.log(compensatory);

  if (session === null) return;
  await supabase
    .from("compensatorys")
    .update({
      approve_request: true,
      approved_date: new Date(),
      approved_by: approved_by,
    })
    .eq("id", compensatory.id)
    .select("*");

  await supabase
    .from("users")
    .update({
      num_compensatorys: compensatory.num_compensatorys + compensatory.hours,
    })
    .eq("id", compensatory.user_id)
    .select(`*`);

  try {
    const data = await resend.emails.send({
      from: "Team <team@peruinjapan.com>",
      to: `${compensatory.email}`,
      subject: `Solicitud de horas por compensatorio  ${compensatory.email}`,
      text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú en Japón para informarle que, se ha aprobado su solicitud de registro de compensatorio.`,
    });
    revalidatePath(`/`);
    return {
      success: true,
    };
  } catch (error) {
    console.log(error);
  }
}
