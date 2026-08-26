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
      // The administration queue is only for active administrative staff.
      // `!inner` prevents orphaned or non-eligible vacation rows from
      // reaching the page at all.
      .select('*, user1:users!vacations_id_user_fkey!inner(*)')
      .eq('user1.is_active', true)
      .eq('user1.is_diplomatic', false)
      .gte('days',  0)
      .order('request_date', { ascending: false });

    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getVacationsWithUser;
