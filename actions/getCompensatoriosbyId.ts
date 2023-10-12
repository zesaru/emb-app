import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatorioswithUserById = async():Promise<CompensatorysWithUser[]> => {
    const supabase = createServerComponentClient({
      cookies: cookies
    });

    const { data, error } = await supabase
      .from('compensatorys')
      .select('*, user1:users!user_id(*), user2:users!approved_by(*)')
      .eq('user_id', '6e84c678-1adc-4b7e-95b5-f59938209e03')
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getsCompensatorioswithUserById;