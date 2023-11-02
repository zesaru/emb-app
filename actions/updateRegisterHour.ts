"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export default async function updateApproveRegisterHour(compensatory: any) {
  const supabase = createServerActionClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const approved_by = session?.user?.id;

  if (session === null) return;
  await supabase
    .from("compensatorys")
    .update({
      final_approve_request: true,
      approved_by_compensated: approved_by,
    })
    .eq("id", compensatory.id)
    .select("*");

  await supabase.rpc("subtract_compensatory_hours", {
    hours: compensatory.compensated_hours,
    user_id: compensatory.user_id,
  });

  try {
    await resend.emails.send({
      from: "Team <team@peruinjapan.com>",
      to: `${compensatory.email}`,
      subject: `Aprobacion de descanso  por compensatorio del usuario  ${compensatory.email}`,
      text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú en Japón para informarle que, se ha aprobado su solicitud de descanso por compensatorio.`,
    });
    revalidatePath(`/`);
    return {
      success: true,
    };
  } catch (error) {
    console.log(error);
  }
}
