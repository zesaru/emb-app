'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSecurityManager, getClientIdentifier, getClientInfo } from '@/lib/rate-limiter'
import { createDeviceSessionManager, RememberMeCookieManager } from '@/lib/device-sessions'

interface LogoutOptions {
  allDevices?: boolean
  reason?: 'user_initiated' | 'security_logout' | 'session_expired'
}

export async function logoutAction(options: LogoutOptions = {}) {
  const headersList = headers()
  const request = new Request('http://localhost', { headers: headersList })
  const identifier = getClientIdentifier(request)
  const clientInfo = getClientInfo(request)
  const securityManager = createSecurityManager()
  const deviceSessionManager = createDeviceSessionManager()

  try {
    const supabase = createServerActionClient({ cookies })
    
    // Get current user before logout
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Log the logout event
      await securityManager.logSecurityEvent({
        event_type: 'user_logout',
        severity: 'low',
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        metadata: {
          user_id: user.id,
          identifier,
          reason: options.reason || 'user_initiated',
          all_devices: options.allDevices || false
        }
      })

      // Clear remember me sessions
      const rememberToken = RememberMeCookieManager.getRememberMeToken()
      if (rememberToken) {
        try {
          const validation = await deviceSessionManager.validateRememberMeToken(
            rememberToken,
            {
              userAgent: clientInfo.userAgent,
              ip: clientInfo.ip,
              acceptLanguage: clientInfo.acceptLanguage || undefined
            }
          )

          if (validation.valid && validation.sessionId) {
            if (options.allDevices) {
              // Revoke all device sessions for this user
              await deviceSessionManager.revokeAllUserSessions(user.id)
              
              await securityManager.logSecurityEvent({
                event_type: 'all_sessions_revoked',
                severity: 'medium',
                ip_address: clientInfo.ip,
                user_agent: clientInfo.userAgent,
                metadata: {
                  user_id: user.id,
                  identifier
                }
              })
            } else {
              // Revoke only current device session
              await deviceSessionManager.revokeDeviceSession(validation.sessionId, user.id)
            }
          }
        } catch (error) {
          console.error('Error revoking device session:', error)
        }
      }

      // Clear remember me cookie
      RememberMeCookieManager.clearRememberMeToken()
    }

    // Sign out from Supabase
    await supabase.auth.signOut()

    return { success: true }

  } catch (error) {
    console.error('Logout error:', error)
    
    await securityManager.logSecurityEvent({
      event_type: 'logout_error',
      severity: 'medium',
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      metadata: {
        identifier,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    // Even if there's an error, try to redirect to login
    return { success: false, error: 'Error during logout' }
  }
}

export async function logoutAndRedirect(allDevices: boolean = false) {
  const result = await logoutAction({ allDevices, reason: 'user_initiated' })
  return result
}