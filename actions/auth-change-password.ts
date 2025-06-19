'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies, headers } from 'next/headers'
import { createSecurityManager, getClientIdentifier, getClientInfo, securityConfig } from '@/lib/rate-limiter'
import { changePasswordSchema, InputSanitizer, SecurityValidator, genericErrorMessages } from '@/lib/validation'

interface ChangePasswordResult {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  rateLimited?: boolean
}

export async function changePasswordAction(formData: FormData): Promise<ChangePasswordResult> {
  const headersList = headers()
  const request = new Request('http://localhost', { headers: headersList })
  const identifier = getClientIdentifier(request)
  const clientInfo = getClientInfo(request)
  const securityManager = createSecurityManager()

  try {
    // 1. Check rate limiting for password changes
    const rateLimitResult = await securityManager.checkRateLimit({
      ...securityConfig.rateLimits.passwordReset,
      identifier
    })

    if (!rateLimitResult.success) {
      return {
        error: rateLimitResult.blockReason || 'Demasiados intentos. Intenta nuevamente más tarde.',
        rateLimited: true
      }
    }

    // 2. Get and validate form data
    const rawCurrentPassword = formData.get('currentPassword')
    const rawNewPassword = formData.get('newPassword') 
    const rawConfirmPassword = formData.get('confirmPassword')

    if (typeof rawCurrentPassword !== 'string' || 
        typeof rawNewPassword !== 'string' || 
        typeof rawConfirmPassword !== 'string') {
      return { error: genericErrorMessages.invalidInput }
    }

    // 3. Sanitize inputs
    const currentPassword = InputSanitizer.sanitizeString(rawCurrentPassword)
    const newPassword = InputSanitizer.sanitizeString(rawNewPassword)
    const confirmPassword = InputSanitizer.sanitizeString(rawConfirmPassword)

    // 4. Validate with schema
    const validatedFields = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword
    })

    if (!validatedFields.success) {
      return {
        error: 'Datos de entrada inválidos',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { currentPassword: validCurrentPassword, newPassword: validNewPassword } = validatedFields.data

    // 5. Get current user
    const supabase = createServerActionClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Usuario no autenticado' }
    }

    // 6. Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validCurrentPassword,
    })

    if (signInError) {
      await securityManager.recordLoginAttempt(identifier, false, {
        email: user.email,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        userId: user.id
      })

      await securityManager.logSecurityEvent({
        event_type: 'password_change_failed_current_password',
        severity: 'medium',
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        metadata: {
          user_id: user.id,
          identifier,
          reason: 'Invalid current password'
        }
      })

      return { error: 'Contraseña actual incorrecta' }
    }

    // 7. Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validNewPassword
    })

    if (updateError) {
      await securityManager.logSecurityEvent({
        event_type: 'password_change_failed',
        severity: 'medium',
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        metadata: {
          user_id: user.id,
          identifier,
          error: updateError.message
        }
      })

      return { error: 'Error al actualizar la contraseña. Intenta nuevamente.' }
    }

    // 8. Log successful password change
    await securityManager.logSecurityEvent({
      event_type: 'password_changed',
      severity: 'medium',
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      metadata: {
        user_id: user.id,
        identifier
      }
    })

    // 9. Optionally revoke all other sessions for security
    // This forces re-authentication on all devices
    await supabase.auth.signOut({ scope: 'others' })

    return { success: true }

  } catch (error) {
    await securityManager.logSecurityEvent({
      event_type: 'password_change_system_error',
      severity: 'high',
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      metadata: {
        identifier,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return { error: genericErrorMessages.serverError }
  }
}

export async function resetPasswordAction(email: string): Promise<{ success?: boolean; error?: string }> {
  const headersList = headers()
  const request = new Request('http://localhost', { headers: headersList })
  const identifier = getClientIdentifier(request)
  const clientInfo = getClientInfo(request)
  const securityManager = createSecurityManager()

  try {
    // Check rate limiting
    const rateLimitResult = await securityManager.checkRateLimit({
      ...securityConfig.rateLimits.passwordReset,
      identifier
    })

    if (!rateLimitResult.success) {
      return { error: rateLimitResult.blockReason || 'Demasiados intentos. Intenta nuevamente más tarde.' }
    }

    // Sanitize email
    const sanitizedEmail = InputSanitizer.sanitizeEmail(email)

    // Validate email format
    if (!sanitizedEmail.includes('@') || sanitizedEmail.length < 5) {
      return { error: 'Email inválido' }
    }

    const supabase = createServerActionClient({ cookies })
    
    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/reset-password`
    })

    if (error) {
      await securityManager.logSecurityEvent({
        event_type: 'password_reset_failed',
        severity: 'medium',
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        metadata: {
          identifier,
          email: sanitizedEmail,
          error: error.message
        }
      })

      return { error: 'Error al enviar email de recuperación' }
    }

    // Log password reset request
    await securityManager.logSecurityEvent({
      event_type: 'password_reset_requested',
      severity: 'low',
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      metadata: {
        identifier,
        email: sanitizedEmail
      }
    })

    return { success: true }

  } catch (error) {
    await securityManager.logSecurityEvent({
      event_type: 'password_reset_system_error',
      severity: 'high',
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      metadata: {
        identifier,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return { error: 'Error del servidor. Intenta nuevamente.' }
  }
}