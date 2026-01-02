import { createClient } from "@/utils/supabase/server";

import { VacationsWithUser } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getVacationsWithUser = async():Promise<VacationsWithUser[]> => {
    const supabase = await createClient();

    // Verificar autenticación - CRÍTICO PARA SEGURIDAD
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from('vacations')
      .select('*, user1:users!vacations_user_id_fkey(*)')
      .gte('days',  0);

    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getVacationsWithUser;