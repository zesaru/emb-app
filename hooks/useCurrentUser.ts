'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: string
  is_admin: boolean
  last_sign_in?: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true)
        
        // Get current auth user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          setError(authError.message)
          return
        }

        setUser(user)

        if (user) {
          // Get user profile from users table
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error('Error fetching user profile:', profileError)
            // Create basic profile from auth user
            setProfile({
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
              avatar_url: user.user_metadata?.avatar_url,
              role: 'Usuario',
              is_admin: false
            })
          } else {
            setProfile({
              id: userProfile.id,
              email: userProfile.email || user.email || '',
              name: userProfile.name || user.user_metadata?.full_name || 'Usuario',
              avatar_url: userProfile.avatar_url || user.user_metadata?.avatar_url,
              role: userProfile.is_admin ? 'Administrador' : 'Usuario',
              is_admin: userProfile.is_admin || false,
              last_sign_in: userProfile.last_sign_in_at
            })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          getUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: profile?.is_admin || false
  }
}