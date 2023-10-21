'use server'

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";

export default async function updateApproveRegister (compensatory:any) {
    const supabase = createServerActionClient({ cookies });

    const {
        data: { session },
      } = await supabase.auth.getSession();
      const approved_by = session?.user?.id;
      console.log(compensatory)

    if (session === null) return;
    await supabase 
        .from('compensatorys')
        .update({
            approve_request: true,
            approved_date: new Date(),
            approved_by: approved_by
        })
        .eq('id', compensatory.id)
        .select('*')
    
    await supabase
      .from("users")
      .update({
        num_compensatorys: compensatory.num_compensatorys + compensatory.hours,
      })
      .eq("id", compensatory.user_id)
      .select(`*`);
    
    revalidatePath(`/`);
    return {
        success: true,
    }
}


