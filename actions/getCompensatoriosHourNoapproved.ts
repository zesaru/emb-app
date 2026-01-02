import { createClient } from "@/utils/supabase/server";

import { CompensatorysWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getCompensatoriosHourNoapproved = async():Promise<CompensatorysWithUser[]> => {
    const supabase = createClient();

    const { data } = await supabase.rpc("list_hours_unapproved_compensatorys");
    return (data as any) || [];
}

export default getCompensatoriosHourNoapproved;