import { createClient } from "@/utils/supabase/server";

import { VacationsWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getVacationswithUserById = async(id:string):Promise<VacationsWithUser[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('vacations')
      .select('*, user1:users!vacations_id_user_fkey(*)')
      .eq('id_user', id)
      .order('request_date', { ascending: false });

    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getVacationswithUserById;
