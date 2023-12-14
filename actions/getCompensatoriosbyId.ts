import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatorioswithUserById = async(id:string):Promise<CompensatorysWithUser[]> => {
    const supabase = createServerComponentClient({
      cookies: cookies
    });

    
    const { data, error } = await supabase.rpc("get_compensatorys_for_user", {
      user_id: id,
    });
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getsCompensatorioswithUserById;