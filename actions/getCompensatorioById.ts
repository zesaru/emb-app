import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatorioById = async(id:string):Promise<CompensatorysWithUser[]> => {
    const supabase = createServerComponentClient({
      cookies: cookies
    });

    const { data, error } = await supabase
      .from('compensatorys')
      .select('*, user1:users!user_id(*)')
      .eq('id', id)
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getsCompensatorioById;