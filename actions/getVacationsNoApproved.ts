import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { VacationsWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getVacationsNoapproved = async():Promise<VacationsWithUser[]> => {
    const supabase = createServerComponentClient<Database>({
      cookies: cookies
    });
   
    const { data } = await supabase.rpc("list_unapproved_vacations");
    return (data as any) || [];
}

export default getVacationsNoapproved;