"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export default async function updateApproveRegisterHour(compensatory: any) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const approved_by = user?.id;

  if (!user) return;
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
