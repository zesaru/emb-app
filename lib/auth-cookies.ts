'use server'

import { cookies } from 'next/headers'

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  
  console.log('Starting cookie cleanup...')
  
  // First, get all existing cookies to see what we're working with
  try {
    const allCookies = cookieStore.getAll()
    console.log('All cookies found before cleanup:', allCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value
    })))
    
    // Clear ALL cookies that might be auth-related
    allCookies.forEach(cookie => {
      const shouldClear = (
        cookie.name.startsWith('sb-') || 
        cookie.name.includes('supabase') ||
        cookie.name.includes('auth') ||
        cookie.name.includes('token') ||
        cookie.name.includes('session') ||
        // Common Supabase cookie patterns
        cookie.name.match(/^sb.*auth.*token$/i) ||
        cookie.name.match(/^.*supabase.*$/i)
      )
      
      if (shouldClear) {
        try {
          // Multiple approaches to clear the cookie
          console.log(`Attempting to clear cookie: ${cookie.name}`)
          
          // Method 1: Delete
          cookieStore.delete(cookie.name)
          
          // Method 2: Set to empty with past expiration
          cookieStore.set({
            name: cookie.name,
            value: '',
            expires: new Date(0),
            path: '/',
            maxAge: 0,
            httpOnly: false,
            secure: false,
            sameSite: 'lax'
          })
          
          // Method 3: Set with different path variations
          const paths = ['/', '/login', '/auth']
          paths.forEach(path => {
            try {
              cookieStore.set({
                name: cookie.name,
                value: '',
                expires: new Date(0),
                path: path,
                maxAge: 0,
                httpOnly: false,
                secure: false,
                sameSite: 'lax'
              })
            } catch (e) {
              // Ignore path-specific errors
            }
          })
          
          console.log(`Successfully processed cookie: ${cookie.name}`)
        } catch (err) {
          console.log(`Could not clear cookie ${cookie.name}:`, err)
        }
      }
    })
    
    // Also try to clear known Supabase cookie patterns even if they don't exist
    const knownPatterns = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase.auth.token',
      'sb-localhost-auth-token',
      'sb-auth-token',
      'sb-auth-token-code-verifier',
      'supabase.auth.code_verifier',
      'supabase.auth.state',
      'sb-state',
      'sb-code-verifier',
      // Try with localhost prefix
      'sb-localhost-auth-token-live',
      'sb-127.0.0.1-auth-token',
      'sb-localhost:3000-auth-token',
      'sb-localhost:3001-auth-token'
    ]
    
    knownPatterns.forEach(cookieName => {
      try {
        cookieStore.delete(cookieName)
        cookieStore.set({
          name: cookieName,
          value: '',
          expires: new Date(0),
          path: '/',
          maxAge: 0,
          httpOnly: false,
          secure: false,
          sameSite: 'lax'
        })
        console.log(`Cleared known pattern: ${cookieName}`)
      } catch (err) {
        // Ignore errors for non-existent cookies
      }
    })
    
  } catch (err) {
    console.log('Could not get all cookies:', err)
  }
  
  console.log('Cookie cleanup completed')
}