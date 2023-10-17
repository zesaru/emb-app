import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function UpdateCompensatorio() {
  const supabase = createServerActionClient({ cookies });

  const { data, error } = await supabase
    .from("compensatorys")
    .update({ approve_request: true })
    .eq("id", '299c352c-1b40-490f-b17d-94b776a5a1d8')
    .select();
  
}
