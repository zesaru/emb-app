import { createClient } from "@/utils/supabase/server";

import { VacationsWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getVacationsWithUser = async():Promise<VacationsWithUser[]> => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('vacations')
      .select('*, user1:users!id_user(*)')
      .gte('days',  0);
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getVacationsWithUser;