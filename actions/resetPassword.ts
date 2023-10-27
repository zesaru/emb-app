"use server";

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const getUsers = async(data:any) => {
  const supabase = createRouteHandlerClient({ cookies })
    const result = await supabase
      .auth
      .updateUser({
        email: data.email,
        password: data.password,
      })
    
    console.log(result)
    return (result as any) || [];
}

export default getUsers;