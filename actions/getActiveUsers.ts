import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { UsersEntity } from "@/types/collections";

export const dynamic = 'force-dynamic';

const getActiveUsers = async(): Promise<UsersEntity[]> => {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    );

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
  
    if (error) {
      console.log('Error fetching active users:', error.message);
    }

    return (data as any) || [];
}

export default getActiveUsers;