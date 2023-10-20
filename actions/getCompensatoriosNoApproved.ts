import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatoriosNoApproved = async():Promise<CompensatorysWithUser[]> => {
    const supabase = createServerComponentClient<Database>({
      cookies: cookies
    });
   
    const { data } = await supabase.rpc("list_unapproved_compensatorys");

    return (data as any) || [];
}

export default getsCompensatoriosNoApproved;