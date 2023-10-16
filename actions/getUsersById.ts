import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { UsersEntity } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getUsersById = async(id:string):Promise<UsersEntity[]> => {
    const supabase = createServerComponentClient({
      cookies: cookies
    });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getUsersById;