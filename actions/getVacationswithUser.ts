import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { VacationsWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getVacationsWithUser = async():Promise<VacationsWithUser[]> => {
    const supabase = createServerComponentClient({
      cookies: cookies
    });

    const { data, error } = await supabase
      .from('vacations')
      .select('*, user1:users!id_user(*)')
      .gte('days',  0)
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getVacationsWithUser;