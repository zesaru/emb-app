import { createClient } from "@/utils/supabase/server";

import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getsCompensatorioswithUserById = async(id:string):Promise<CompensatorysWithUser[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('compensatorys')
      .select('*, user1:users!compensatorys_user_id_fkey(*)')
      .eq('user_id', id);

    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getsCompensatorioswithUserById;