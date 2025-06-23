'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSecurityManager, getClientIdentifier, getClientInfo, securityConfig } from '@/lib/rate-limiter'
import { loginSchema, InputSanitizer, SecurityValidator, genericErrorMessages } from '@/lib/validation'
import { createDeviceSessionManager, RememberMeCookieManager } from '@/lib/device-sessions'

interface LoginResult {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  rateLimited?: boolean
  suspiciousActivity?: boolean
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const headersList = await headers()
  const request = new Request('http://localhost', { headers: headersList })
  const identifier = getClientIdentifier(request)
  const clientInfo = getClientInfo(request)
  const securityManager = createSecurityManager()

  try {
    // 1. Validate client information
    if (!SecurityValidator.isValidUserAgent(clientInfo.userAgent)) {
      await securityManager.logSecurityEvent({
        event_type: 'invalid_user_agent',
        severity: 'medium',
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        metadata: { identifier }
      })
    }

    if (!SecurityValidator.isValidIP(clientInfo.ip)) {
      await securityManager.logSecurityEvent({
        event_type: 'invalid_ip_address',
        severity: 'medium',
        ip_address: clientInfo.ip,
        metadata: { identifier }
      })
    }

    // 2. Check rate limiting
    const rateLimitResult = await securityManager.checkRateLimit({
      ...securityConfig.rateLimits.login,
      identifier
    })

    if (!rateLimitResult.success) {
      return {
        error: rateLimitResult.blockReason || genericErrorMessages.rateLimitExceeded,
        rateLimited: true
      }
    }

    // 3. Sanitize and validate input
    const rawEmail = formData.get('email')
    const rawPassword = formData.get('password')

    if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
      await securityManager.recordLoginAttempt(identifier, false, {
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent
      })
      return { error: genericErrorMessages.invalidInput }
    }

    const sanitizedEmail = InputSanitizer.sanitizeEmail(rawEmail)
    const sanitizedPassword = InputSanitizer.sanitizeString(rawPassword)

    // 4. Detect suspicious patterns
    const suspiciousCheck = SecurityValidator.detectSuspiciousPatterns({
      email: sanitizedEmail,
      userAgent: clientInfo.userAgent,
      ip: clientInfo.ip,
      referer: clientInfo.referer || undefined
    })

    if (suspiciousCheck.suspicious) {
      await securityManager.logSecurityEvent({
        event_type: 'suspicious_login_attempt',
        severity: 'high',
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        metadata: {
          identifier,
          email: sanitizedEmail,
          reasons: suspiciousCheck.reasons
        }
      })

      await securityManager.recordLoginAttempt(identifier, false, {
        email: sanitizedEmail,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent
      })

      return {
        error: genericErrorMessages.suspiciousActivity,
        suspiciousActivity: true
      }
    }

    // 5. Schema validation
    const validatedFields = loginSchema.safeParse({
      email: sanitizedEmail,
      password: sanitizedPassword,
    })

    if (!validatedFields.success) {
      await securityManager.recordLoginAttempt(identifier, false, {
        email: sanitizedEmail,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent
      })

      return {
        error: genericErrorMessages.invalidInput,
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { email, password } = validatedFields.data

    // 6. Attempt authentication
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
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    const loginSuccess = !authError && !!authData?.user

    // 7. Record login attempt
    await securityManager.recordLoginAttempt(identifier, loginSuccess, {
      email,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      userId: authData?.user?.id
    })

    if (authError || !loginSuccess) {
      // Don't reveal specific auth errors
      return {
        error: genericErrorMessages.invalidCredentials
      }
    }

    // 8. Log successful login
    await securityManager.logSecurityEvent({
      event_type: 'successful_login',
      severity: 'low',
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      metadata: {
        identifier,
        user_id: authData.user.id,
        email
      }
    })

    return { success: true }

  } catch (error) {
    // Log unexpected errors
    await securityManager.logSecurityEvent({
      event_type: 'login_system_error',
      severity: 'critical',
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      metadata: {
        identifier,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return {
      error: genericErrorMessages.serverError
    }
  }
}

export async function loginWithCredentials(email: string, password: string, rememberMe: boolean = false): Promise<void> {
  const headersList = await headers()
  const request = new Request('http://localhost', { headers: headersList })
  const identifier = getClientIdentifier(request)
  const clientInfo = getClientInfo(request)
  const securityManager = createSecurityManager()

  try {
    // Check rate limiting
    const rateLimitResult = await securityManager.checkRateLimit({
      ...securityConfig.rateLimits.login,
      identifier
    })

    if (!rateLimitResult.success) {
      throw new Error(rateLimitResult.blockReason || genericErrorMessages.rateLimitExceeded)
    }

    // Sanitize inputs
    const sanitizedEmail = InputSanitizer.sanitizeEmail(email)
    const sanitizedPassword = InputSanitizer.sanitizeString(password)

    // Validate with schema
    const validatedFields = loginSchema.safeParse({
      email: sanitizedEmail,
      password: sanitizedPassword,
    })

    if (!validatedFields.success) {
      await securityManager.recordLoginAttempt(identifier, false, {
        email: sanitizedEmail,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent
      })
      throw new Error(genericErrorMessages.invalidInput)
    }

    // Attempt login
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
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedFields.data.email,
      password: validatedFields.data.password,
    })

    const loginSuccess = !authError && !!authData?.user

    // Record attempt
    await securityManager.recordLoginAttempt(identifier, loginSuccess, {
      email: validatedFields.data.email,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      userId: authData?.user?.id
    })

    if (authError || !loginSuccess) {
      throw new Error(genericErrorMessages.invalidCredentials)
    }

    // Log successful login
    await securityManager.logSecurityEvent({
      event_type: 'successful_login',
      severity: 'low',
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      metadata: {
        identifier,
        user_id: authData.user.id,
        email: validatedFields.data.email
      }
    })

    // Create remember me session if requested
    if (rememberMe) {
      try {
        const deviceSessionManager = createDeviceSessionManager()
        const rememberMeToken = await deviceSessionManager.createRememberMeSession(
          authData.user.id,
          {
            userAgent: clientInfo.userAgent,
            ip: clientInfo.ip,
            acceptLanguage: clientInfo.acceptLanguage || undefined
          },
          30 // 30 days
        )

        // Set the remember me cookie
        await RememberMeCookieManager.setRememberMeToken(
          rememberMeToken.token,
          rememberMeToken.expiresAt
        )

        await securityManager.logSecurityEvent({
          event_type: 'remember_me_created',
          severity: 'low',
          ip_address: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          metadata: {
            user_id: authData.user.id,
            expires_at: rememberMeToken.expiresAt.toISOString()
          }
        })
      } catch (error) {
        // Don't fail login if remember me fails, just log it
        console.error('Failed to create remember me session:', error)
        await securityManager.logSecurityEvent({
          event_type: 'remember_me_creation_failed',
          severity: 'medium',
          ip_address: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          metadata: {
            user_id: authData.user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }

  } catch (error) {
    await securityManager.logSecurityEvent({
      event_type: 'login_error',
      severity: 'medium',
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      metadata: {
        identifier,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    throw error
  }

  redirect('/')
}