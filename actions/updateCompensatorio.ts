import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function UpdateCompensatorio(compensatory: any) {
  const supabase = createServerActionClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const approveby = user?.id;
  const compensatorio = compensatory[0];

  try {
    await supabase
      .from("compensatorys")
      .update({
        approve_request: true,
        approved_date: new Date(),
        approved_by: approveby,
      })
      .eq("id", compensatorio.id)
      .select(`*`);

    await supabase
      .from("users")
      .update({
        num_compensatorys:
          compensatorio.user1.num_compensatorys + compensatorio.hours,
      })
      .eq("id", compensatorio.user1.id)
      .select(`*`);

    try {
      const data = await resend.emails.send({
        from: "Team <team@peruinjapan.com>",
        to: `${ compensatorio.user1.email}`,
        subject: `Solicitud de horas por compensatorio  ${ compensatorio.user1.email}`,
        text: `El siguiente email ha sido enviado desde la plataforma de compensatorios de la Embajada del Perú en Japón para informarle se ha aprobado su solicitud de compensatorio.`,
      });

      revalidatePath(`/compensatorios/approvec/${compensatorio.id}`);
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  } catch (error) {
    console.log(error);
  }
}
