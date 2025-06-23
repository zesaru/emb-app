import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getServerUser() {
  const supabase = createServerComponentClient({ cookies: await cookies })
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return user
}

export async function createServerSupabaseClient() {
  return createServerComponentClient({ cookies: await cookies })
}