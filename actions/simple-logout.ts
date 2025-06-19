'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { clearAuthCookies } from '@/lib/auth-cookies'

export async function simpleLogout() {
  try {
    console.log('Starting simple logout...')
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies })
    
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