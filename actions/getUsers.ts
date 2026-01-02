import { createClient } from "@/utils/supabase/server";
import { UsersEntity } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getUsers = async():Promise<UsersEntity[]> => {
    const supabase = createClient();

    // Verificar autenticación - CRÍTICO PARA SEGURIDAD
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getUsers;