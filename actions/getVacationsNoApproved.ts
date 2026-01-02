import { createClient } from "@/utils/supabase/server";

import { VacationsWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getVacationsNoapproved = async():Promise<VacationsWithUser[]> => {
    const supabase = createClient();

    const { data } = await supabase.rpc("list_unapproved_vacations");
    return (data as any) || [];
}

export default getVacationsNoapproved;