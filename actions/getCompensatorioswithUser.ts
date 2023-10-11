import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { CompensatorysWithUser } from "./../types/collections";

const getsCompensatorioswithUser = async():Promise<CompensatorysWithUser[]> => {
    const supabase = createServerComponentClient({
      cookies: cookies
    });

    const { data, error } = await supabase
      .from('compensatorys')
      .select('*, user1:users!user_id(*), user2:users!approved_by(*)')
  
    if (error) {
      console.log(error.message);
    }
    console.log(data);
    return (data as any) || [];
}

export default getsCompensatorioswithUser;