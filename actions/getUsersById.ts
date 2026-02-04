import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

import { UsersEntity } from "./../types/collections";

export const dynamic = 'force-dynamic';

// Use React.cache for per-request deduplication (Vercel best practice)
export const getUsersById = cache(async(id:string):Promise<UsersEntity[]> => {
    const supabase = await createClient();

    // Verificar autenticación - CRÍTICO PARA SEGURIDAD
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id);

    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
});

// Default export for compatibility
export default getUsersById;