'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function checkSession() {
  try {
    const supabase = createServerActionClient({ cookies })
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