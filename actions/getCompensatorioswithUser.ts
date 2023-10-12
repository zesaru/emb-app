import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatorioswithUser = async():Promise<CompensatorysWithUser[]> => {
    const supabase = createServerComponentClient({
      cookies: cookies
    });

    const { data, error } = await supabase
      .from('compensatorys')
      .select('*, user1:users!user_id(*), user2:users!approved_by(*)')
      .gte('hours',  0)
      .order('event_date', { ascending: false })
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getsCompensatorioswithUser;