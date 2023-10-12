import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { UsersEntity } from "./../types/collections";

export const dynamic = 'force-dynamic'

const getUsers = async():Promise<UsersEntity[]> => {
    const supabase = createServerComponentClient({
      cookies: cookies
    });

    const { data, error } = await supabase
      .from('users')
      .select('*')
  
    if (error) {
      console.log(error.message);
    }

    return (data as any) || [];
}

export default getUsers;