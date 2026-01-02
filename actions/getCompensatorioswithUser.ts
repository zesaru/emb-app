import { createClient } from "@/utils/supabase/server";

import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatorioswithUser = async():Promise<CompensatorysWithUser[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('compensatorys')
      .select('*, user1:users!compensatorys_user_id_fkey(*), user2:users!compensatorys_approved_by_fkey(*)')
      .gte('hours',  0)
      .order('event_date', { ascending: false });
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getsCompensatorioswithUser;