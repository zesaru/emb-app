'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function checkSession() {
  try {
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
    )
    const { data: { user }, error } = await supabase.auth.getUser()
    
    console.log('Session check:', {
      hasUser: !!user,
      userId: user?.id?.substring(0, 10) + '...' || null,
      userEmail: user?.email,
      error: error?.message
    })
    
    return {
      hasSession: !!user,
      user: user?.email || null,
      sessionId: user?.id?.substring(0, 10) || null,
      error: error?.message || null
    }
  } catch (error) {
    console.error('Check session error:', error)
    return {
      hasSession: false,
      user: null,
      sessionId: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}