'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { clearAuthCookies } from '@/lib/auth-cookies'

export async function simpleLogout() {
  try {
    console.log('Starting simple logout...')
    const cookieStore = await cookies()
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
    
    // Get current user before logout
    const { data: { user: beforeUser } } = await supabase.auth.getUser()
    console.log('User before logout:', {
      hasUser: !!beforeUser,
      userEmail: beforeUser?.email
    })
    
    // Simple logout - sign out from Supabase
    console.log('Calling supabase.auth.signOut()...')
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Supabase logout error:', error)
      return { success: false, error: error.message }
    }
    
    // Clear all authentication cookies
    await clearAuthCookies()
    
    // Check user after logout
    const { data: { user: afterUser } } = await supabase.auth.getUser()
    console.log('User after logout:', {
      hasUser: !!afterUser,
      userEmail: afterUser?.email
    })
    
    console.log('Simple logout completed successfully')
    return { success: true }
  } catch (error) {
    console.error('Logout catch error:', error)
    return { success: false, error: 'Error durante el logout' }
  }
}