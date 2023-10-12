import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { UsersEntity } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getUsersById = async():Promise<UsersEntity[]> => {
    const supabase = createServerComponentClient({
      cookies: cookies
    });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', '6e84c678-1adc-4b7e-95b5-f59938209e03')
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getUsersById;