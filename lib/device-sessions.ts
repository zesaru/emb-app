import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

interface DeviceFingerprint {
  userAgent: string
  ip: string
  acceptLanguage?: string
  timezone?: string
  screenResolution?: string
}

interface RememberMeToken {
  token: string
  expiresAt: Date
  deviceFingerprint: string
}

export class DeviceSessionManager {
  private async getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
  }
  
  // Generate secure remember me token
  async createRememberMeSession(
    userId: string,
    deviceInfo: DeviceFingerprint,
    durationDays: number = 30
  ): Promise<RememberMeToken> {
    try {
      const supabase = await this.getSupabase();
      
      // Generate cryptographically secure token
      const token = crypto.randomBytes(64).toString('hex')
      const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo)
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      
      // Store in database
      const { error } = await supabase
        .from('device_sessions')
        .insert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          device_name: this.getDeviceName(deviceInfo.userAgent),
          ip_address: deviceInfo.ip,
          user_agent: deviceInfo.userAgent,
          remember_token: token,
          expires_at: expiresAt.toISOString(),
          is_active: true
        })
      
      if (error) {
        throw new Error('Failed to create device session')
      }
      
      return {
        token,
        expiresAt,
        deviceFingerprint
      }
    } catch (error) {
      console.error('Error creating remember me session:', error)
      throw new Error('Failed to create secure session')
    }
  }
  
  // Validate remember me token
  async validateRememberMeToken(
    token: string,
    currentDeviceInfo: DeviceFingerprint
  ): Promise<{ valid: boolean; userId?: string; sessionId?: string }> {
    try {
      if (!token || token.length !== 128) { // 64 bytes = 128 hex chars
        return { valid: false }
      }
      
      const supabase = await this.getSupabase();
      
      // Find active session with this token
      const { data: session, error } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('remember_token', token)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single()
      
      if (error || !session) {
        return { valid: false }
      }
      
      // Verify device fingerprint
      const currentFingerprint = this.generateDeviceFingerprint(currentDeviceInfo)
      if (session.device_fingerprint !== currentFingerprint) {
        // Device fingerprint mismatch - potential token theft
        await this.logSecurityEvent({
          event_type: 'device_fingerprint_mismatch',
          severity: 'high',
          user_id: session.user_id,
          ip_address: currentDeviceInfo.ip,
          user_agent: currentDeviceInfo.userAgent,
          metadata: {
            session_id: session.id,
            stored_fingerprint: session.device_fingerprint,
            current_fingerprint: currentFingerprint,
            token_last_4: token.slice(-4)
          }
        })
        
        // Deactivate the session
        await this.deactivateSession(session.id)
        return { valid: false }
      }
      
      // Update last used timestamp
      await supabase
        .from('device_sessions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', session.id)
      
      return {
        valid: true,
        userId: session.user_id,
        sessionId: session.id
      }
    } catch (error) {
      console.error('Error validating remember me token:', error)
      return { valid: false }
    }
  }
  
  // Revoke a specific device session
  async revokeDeviceSession(sessionId: string, userId?: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      let query = supabase
        .from('device_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { error } = await query
      
      if (error) {
        console.error('Error revoking device session:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error revoking device session:', error)
      return false
    }
  }
  
  // Revoke all device sessions for a user
  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      
      let query = supabase
        .from('device_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
      
      if (exceptSessionId) {
        query = query.neq('id', exceptSessionId)
      }
      
      const { error } = await query
      
      if (error) {
        console.error('Error revoking all user sessions:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error revoking all user sessions:', error)
      return false
    }
  }
  
  // Get active device sessions for a user
  async getUserDeviceSessions(userId: string): Promise<Array<{
    id: string
    deviceName: string
    ipAddress: string
    lastUsedAt: Date
    createdAt: Date
    isCurrent: boolean
  }>> {
    try {
      const supabase = await this.getSupabase();
      
      const { data: sessions, error } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('last_used_at', { ascending: false })
      
      if (error || !sessions) {
        return []
      }
      
      return sessions.map(session => ({
        id: session.id,
        deviceName: session.device_name || 'Unknown Device',
        ipAddress: session.ip_address || 'Unknown',
        lastUsedAt: new Date(session.last_used_at),
        createdAt: new Date(session.created_at),
        isCurrent: false // This would need to be determined by comparing with current session
      }))
    } catch (error) {
      console.error('Error getting user device sessions:', error)
      return []
    }
  }
  
  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      
      await supabase
        .from('device_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error)
    }
  }
  
  private generateDeviceFingerprint(deviceInfo: DeviceFingerprint): string {
    // Create a composite fingerprint from device characteristics
    const components = [
      deviceInfo.userAgent,
      deviceInfo.ip,
      deviceInfo.acceptLanguage || '',
      deviceInfo.timezone || '',
      deviceInfo.screenResolution || ''
    ].join('|')
    
    return crypto.createHash('sha256').update(components).digest('hex')
  }
  
  private getDeviceName(userAgent: string): string {
    // Simple device name extraction from user agent
    if (/iPhone/i.test(userAgent)) return 'iPhone'
    if (/iPad/i.test(userAgent)) return 'iPad'
    if (/Android/i.test(userAgent)) return 'Android Device'
    if (/Windows/i.test(userAgent)) return 'Windows PC'
    if (/Macintosh/i.test(userAgent)) return 'Mac'
    if (/Linux/i.test(userAgent)) return 'Linux PC'
    if (/Chrome/i.test(userAgent)) return 'Chrome Browser'
    if (/Firefox/i.test(userAgent)) return 'Firefox Browser'
    if (/Safari/i.test(userAgent)) return 'Safari Browser'
    
    return 'Unknown Device'
  }
  
  private async deactivateSession(sessionId: string): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      
      await supabase
        .from('device_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
    } catch (error) {
      console.error('Error deactivating session:', error)
    }
  }
  
  private async logSecurityEvent(event: {
    event_type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    user_id?: string
    ip_address?: string
    user_agent?: string
    metadata?: Record<string, any>
  }): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      
      await supabase
        .from('security_events')
        .insert({
          user_id: event.user_id,
          event_type: event.event_type,
          severity: event.severity,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          metadata: event.metadata
        })
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }
}

// Cookie utilities for remember me functionality
export class RememberMeCookieManager {
  private static COOKIE_NAME = 'emb_remember_token'
  private static COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/'
  }
  
  static async setRememberMeToken(token: string, expiresAt: Date): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(this.COOKIE_NAME, token, {
      ...this.COOKIE_OPTIONS,
      expires: expiresAt
    })
  }
  
  static async getRememberMeToken(): Promise<string | undefined> {
    const cookieStore = await cookies()
    return cookieStore.get(this.COOKIE_NAME)?.value
  }
  
  static async clearRememberMeToken(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(this.COOKIE_NAME)
  }
}

export const createDeviceSessionManager = () => new DeviceSessionManager()