import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface RateLimitOptions {
  maxAttempts: number
  windowMs: number
  identifier: string
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: Date
  blocked: boolean
}

export class RateLimiter {
  private supabase = createServerComponentClient({ cookies })

  async checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const { maxAttempts, windowMs, identifier } = options
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMs)

    try {
      // Clean up old attempts
      await this.supabase
        .from('login_attempts')
        .delete()
        .lt('created_at', windowStart.toISOString())

      // Get recent attempts for this identifier
      const { data: attempts, error } = await this.supabase
        .from('login_attempts')
        .select('*')
        .eq('identifier', identifier)
        .gte('created_at', windowStart.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Rate limiter error:', error)
        // If there's an error, allow the request but log it
        return {
          success: true,
          remaining: maxAttempts,
          resetTime: new Date(now.getTime() + windowMs),
          blocked: false
        }
      }

      const attemptCount = attempts?.length || 0
      const remaining = Math.max(0, maxAttempts - attemptCount)
      const blocked = attemptCount >= maxAttempts

      return {
        success: !blocked,
        remaining,
        resetTime: new Date(now.getTime() + windowMs),
        blocked
      }
    } catch (error) {
      console.error('Rate limiter unexpected error:', error)
      return {
        success: true,
        remaining: maxAttempts,
        resetTime: new Date(now.getTime() + windowMs),
        blocked: false
      }
    }
  }

  async recordAttempt(identifier: string, success: boolean, additionalData?: Record<string, any>): Promise<void> {
    try {
      await this.supabase
        .from('login_attempts')
        .insert({
          identifier,
          success,
          ip_address: additionalData?.ipAddress,
          user_agent: additionalData?.userAgent,
          email: additionalData?.email,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to record login attempt:', error)
    }
  }

  async getRecentFailedAttempts(identifier: string, windowMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const windowStart = new Date(Date.now() - windowMs)
    
    try {
      const { data, error } = await this.supabase
        .from('login_attempts')
        .select('id')
        .eq('identifier', identifier)
        .eq('success', false)
        .gte('created_at', windowStart.toISOString())

      if (error) {
        console.error('Error getting failed attempts:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Unexpected error getting failed attempts:', error)
      return 0
    }
  }
}

// Utility functions for different rate limiting strategies
export const createRateLimiter = () => new RateLimiter()

export const getClientIdentifier = (request: Request): string => {
  // Get IP from various headers (considering proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const connectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwardedFor?.split(',')[0].trim() || realIp || connectingIp || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Create a composite identifier
  return `${ip}:${userAgent.slice(0, 100)}`
}

export const rateLimitConfig = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  emailBased: {
    maxAttempts: 3,
    windowMs: 30 * 60 * 1000, // 30 minutes
  },
  strict: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  }
}