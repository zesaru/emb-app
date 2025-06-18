import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'

interface RateLimitOptions {
  maxAttempts: number
  windowMs: number
  identifier: string
  blockDurationMs?: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: Date
  blocked: boolean
  blockReason?: string
}

interface SecurityEvent {
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
}

export class SecurityManager {
  private supabase = createServerComponentClient({ cookies })

  async checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const { maxAttempts, windowMs, identifier, blockDurationMs = windowMs } = options
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMs)

    try {
      // Check if currently blocked
      const { data: blockedCheck } = await this.supabase
        .rpc('is_ip_blocked', { p_identifier: identifier })

      if (blockedCheck) {
        await this.logSecurityEvent({
          event_type: 'rate_limit_blocked_access',
          severity: 'medium',
          metadata: { identifier, reason: 'Attempted access while blocked' }
        })

        return {
          success: false,
          remaining: 0,
          resetTime: new Date(now.getTime() + blockDurationMs),
          blocked: true,
          blockReason: 'Too many failed attempts. Please try again later.'
        }
      }

      // Get recent failed attempts count
      const { data: failedCount } = await this.supabase
        .rpc('count_failed_attempts', { 
          p_identifier: identifier,
          p_window_minutes: Math.floor(windowMs / (60 * 1000))
        })

      const remaining = Math.max(0, maxAttempts - (failedCount || 0))
      const blocked = (failedCount || 0) >= maxAttempts

      if (blocked) {
        // Block the identifier
        const blockedUntil = new Date(now.getTime() + blockDurationMs)
        await this.supabase
          .from('login_attempts')
          .insert({
            identifier,
            success: false,
            blocked_until: blockedUntil.toISOString(),
            attempt_type: 'login'
          })

        await this.logSecurityEvent({
          event_type: 'rate_limit_exceeded',
          severity: 'high',
          metadata: { 
            identifier, 
            failed_attempts: failedCount,
            blocked_until: blockedUntil.toISOString()
          }
        })
      }

      return {
        success: !blocked,
        remaining,
        resetTime: new Date(now.getTime() + windowMs),
        blocked,
        blockReason: blocked ? `Too many failed attempts. Blocked until ${new Date(now.getTime() + blockDurationMs).toLocaleString()}` : undefined
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      await this.logSecurityEvent({
        event_type: 'rate_limiter_error',
        severity: 'medium',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      })

      // Fail-safe: allow request but log the error
      return {
        success: true,
        remaining: maxAttempts,
        resetTime: new Date(now.getTime() + windowMs),
        blocked: false
      }
    }
  }

  async recordLoginAttempt(
    identifier: string, 
    success: boolean, 
    additionalData?: {
      email?: string
      ipAddress?: string
      userAgent?: string
      userId?: string
    }
  ): Promise<void> {
    try {
      // Record login attempt
      await this.supabase
        .from('login_attempts')
        .insert({
          identifier,
          success,
          email: additionalData?.email,
          ip_address: additionalData?.ipAddress,
          user_agent: additionalData?.userAgent,
          attempt_type: 'login'
        })

      // Log security event
      await this.logSecurityEvent({
        event_type: success ? 'successful_login' : 'failed_login',
        severity: success ? 'low' : 'medium',
        ip_address: additionalData?.ipAddress,
        user_agent: additionalData?.userAgent,
        metadata: {
          identifier,
          email: additionalData?.email,
          user_id: additionalData?.userId
        }
      })

      // If failed login, check for suspicious patterns
      if (!success) {
        await this.detectSuspiciousActivity(identifier, additionalData)
      }
    } catch (error) {
      console.error('Failed to record login attempt:', error)
    }
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await this.supabase
        .from('security_events')
        .insert({
          event_type: event.event_type,
          severity: event.severity,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          metadata: event.metadata
        })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  private async detectSuspiciousActivity(
    identifier: string, 
    data?: { email?: string; ipAddress?: string }
  ): Promise<void> {
    try {
      // Check for multiple different emails from same identifier
      const { data: emailAttempts } = await this.supabase
        .from('login_attempts')
        .select('email')
        .eq('identifier', identifier)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .not('email', 'is', null)

      if (emailAttempts && emailAttempts.length > 0) {
        const uniqueEmails = new Set(emailAttempts.map(a => a.email))
        
        if (uniqueEmails.size > 3) {
          await this.logSecurityEvent({
            event_type: 'suspicious_email_enumeration',
            severity: 'high',
            ip_address: data?.ipAddress,
            metadata: {
              identifier,
              unique_emails_attempted: uniqueEmails.size,
              current_email: data?.email
            }
          })
        }
      }

      // Check for rapid-fire attempts
      const { data: recentAttempts } = await this.supabase
        .from('login_attempts')
        .select('created_at')
        .eq('identifier', identifier)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

      if (recentAttempts && recentAttempts.length > 10) {
        await this.logSecurityEvent({
          event_type: 'rapid_fire_attempts',
          severity: 'critical',
          ip_address: data?.ipAddress,
          metadata: {
            identifier,
            attempts_in_5_minutes: recentAttempts.length
          }
        })
      }
    } catch (error) {
      console.error('Error detecting suspicious activity:', error)
    }
  }

  async getSecuritySummary(identifier: string): Promise<{
    recentFailedAttempts: number
    isCurrentlyBlocked: boolean
    lastSuccessfulLogin?: Date
    suspiciousActivityDetected: boolean
  }> {
    try {
      const [failedAttemptsResult, blockedResult, lastLoginResult, suspiciousResult] = await Promise.all([
        this.supabase.rpc('count_failed_attempts', { p_identifier: identifier }),
        this.supabase.rpc('is_ip_blocked', { p_identifier: identifier }),
        this.supabase
          .from('login_attempts')
          .select('created_at')
          .eq('identifier', identifier)
          .eq('success', true)
          .order('created_at', { ascending: false })
          .limit(1),
        this.supabase
          .from('security_events')
          .select('id')
          .eq('metadata->>identifier', identifier)
          .in('event_type', ['suspicious_email_enumeration', 'rapid_fire_attempts'])
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ])

      return {
        recentFailedAttempts: failedAttemptsResult.data || 0,
        isCurrentlyBlocked: blockedResult.data || false,
        lastSuccessfulLogin: lastLoginResult.data?.[0]?.created_at ? new Date(lastLoginResult.data[0].created_at) : undefined,
        suspiciousActivityDetected: (suspiciousResult.data?.length || 0) > 0
      }
    } catch (error) {
      console.error('Error getting security summary:', error)
      return {
        recentFailedAttempts: 0,
        isCurrentlyBlocked: false,
        suspiciousActivityDetected: false
      }
    }
  }
}

// Utility functions
export const createSecurityManager = () => new SecurityManager()

export const getClientIdentifier = (request: Request): string => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const connectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwardedFor?.split(',')[0].trim() || realIp || connectingIp || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Create a more secure identifier
  const rawIdentifier = `${ip}:${userAgent}`
  return crypto.createHash('sha256').update(rawIdentifier).digest('hex').substring(0, 32)
}

export const getClientInfo = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const connectingIp = request.headers.get('cf-connecting-ip')
  
  return {
    ip: forwardedFor?.split(',')[0].trim() || realIp || connectingIp || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    referer: request.headers.get('referer'),
    acceptLanguage: request.headers.get('accept-language')
  }
}

// Security configurations
export const securityConfig = {
  rateLimits: {
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000 // 30 minutes block
    },
    passwordReset: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 2 * 60 * 60 * 1000 // 2 hours block
    },
    suspicious: {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 24 * 60 * 60 * 1000 // 24 hours block
    }
  },
  validation: {
    emailMaxLength: 254,
    passwordMinLength: 8,
    passwordMaxLength: 128
  }
}