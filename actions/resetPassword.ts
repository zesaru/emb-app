import { supabase } from '@/lib/supabase'

const getUsers = async(data:any) => {
    const result = await supabase
    .auth
    .updateUser({
        email: data.email,
        password: data.password,
      })
    

    return (result as any)?.result || [];

}


export default getUsers;