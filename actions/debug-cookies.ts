'use server'

import { cookies } from 'next/headers'

export async function debugCookies() {
  const cookieStore = await cookies()
  
  try {
    const allCookies = cookieStore.getAll()
    console.log('=== ALL COOKIES DEBUG ===')
    console.log('Total cookies found:', allCookies.length)
    
    allCookies.forEach((cookie, index) => {
      console.log(`Cookie ${index + 1}:`, {
        name: cookie.name,
        value: cookie.value?.substring(0, 50) + '...',
        hasValue: !!cookie.value
      })
    })
    
    console.log('=== END COOKIES DEBUG ===')
    
    return {
      cookies: allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0
      }))
    }
  } catch (error) {
    console.error('Error getting cookies:', error)
    return { cookies: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}