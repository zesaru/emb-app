import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Enhanced validation schemas with security considerations
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .max(254, 'Email demasiado largo') // RFC 5321 limit
    .email('Formato de email inválido')
    .transform(email => email.toLowerCase().trim())
    .refine(email => {
      // Additional email validation
      const parts = email.split('@')
      if (parts.length !== 2) return false
      const [local, domain] = parts
      
      // Check local part length (64 chars max per RFC 5321)
      if (local.length > 64) return false
      
      // Prevent common attack patterns
      const suspiciousPatterns = [
        /\.\./,  // consecutive dots
        /^\./,   // starts with dot
        /\.$/,   // ends with dot
        /[<>]/,  // angle brackets
        /[\x00-\x1f\x7f]/  // control characters
      ]
      
      return !suspiciousPatterns.some(pattern => pattern.test(email))
    }, 'Email contiene caracteres no válidos'),
    
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'Contraseña demasiado larga')
    .refine(password => {
      // Check for null bytes and other dangerous characters
      return !password.includes('\0') && !/[\x00-\x08\x0e-\x1f\x7f]/.test(password)
    }, 'La contraseña contiene caracteres no válidos')
})

export const passwordResetSchema = z.object({
  email: loginSchema.shape.email
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(128, 'Contraseña demasiado larga')
    .refine(password => {
      // Strong password requirements
      const hasLowerCase = /[a-z]/.test(password)
      const hasUpperCase = /[A-Z]/.test(password)
      const hasNumbers = /\d/.test(password)
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
      
      const strengthCount = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChar].filter(Boolean).length
      return strengthCount >= 3
    }, 'La contraseña debe contener al menos 3 de: minúsculas, mayúsculas, números, caracteres especiales'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})

// Sanitization functions
export class InputSanitizer {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string')
    }
    
    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x08\x0e-\x1f\x7f]/g, '')
    
    // Trim whitespace
    sanitized = sanitized.trim()
    
    // Limit length to prevent DoS
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000)
    }
    
    return sanitized
  }
  
  static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email)
    return sanitized.toLowerCase()
  }
  
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    })
  }
  
  static sanitizeFilename(filename: string): string {
    // Remove dangerous characters from filenames
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255)
  }
}

// Rate limiting helpers
export class SecurityValidator {
  static isValidUserAgent(userAgent?: string): boolean {
    if (!userAgent) return false
    
    // Check for suspiciously short or long user agents
    if (userAgent.length < 10 || userAgent.length > 1000) return false
    
    // Check for common bot patterns (customize as needed)
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i
    ]
    
    // For now, just log suspicious user agents but don't block
    const isSuspicious = botPatterns.some(pattern => pattern.test(userAgent))
    if (isSuspicious) {
      console.log('Suspicious user agent detected:', userAgent.substring(0, 100))
    }
    
    return true
  }
  
  static isValidIP(ip: string): boolean {
    if (!ip || ip === 'unknown') return false
    
    // Basic IP format validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/
    
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) return false
    
    // Check for private/local IPs that might indicate proxying issues
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ]
    
    const isPrivate = privateRanges.some(range => range.test(ip))
    if (isPrivate) {
      console.log('Private IP detected, might be behind proxy:', ip)
    }
    
    return true
  }
  
  static detectSuspiciousPatterns(data: {
    email?: string
    userAgent?: string
    ip?: string
    referer?: string
  }): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = []
    
    // Check for SQL injection patterns
    if (data.email) {
      const sqlPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /insert\s+into/i,
        /delete\s+from/i,
        /update\s+set/i,
        /exec\s*\(/i,
        /script\s*>/i
      ]
      
      if (sqlPatterns.some(pattern => pattern.test(data.email))) {
        reasons.push('SQL injection pattern detected in email')
      }
    }
    
    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /eval\s*\(/i
    ]
    
    const checkXSS = (value: string) => 
      xssPatterns.some(pattern => pattern.test(value))
    
    if (data.email && checkXSS(data.email)) {
      reasons.push('XSS pattern detected in email')
    }
    
    // Check for suspicious user agent
    if (data.userAgent) {
      if (data.userAgent.length > 2000) {
        reasons.push('Abnormally long user agent')
      }
      
      if (data.userAgent.includes('sqlmap') || data.userAgent.includes('nikto')) {
        reasons.push('Security scanner detected')
      }
    }
    
    // Check for missing or suspicious referer
    if (data.referer === undefined) {
      // Missing referer might be suspicious but is common with direct navigation
      // Log but don't block
    }
    
    return {
      suspicious: reasons.length > 0,
      reasons
    }
  }
}

// Type guards
export const isValidLoginInput = (input: unknown): input is { email: string; password: string } => {
  return (
    typeof input === 'object' &&
    input !== null &&
    'email' in input &&
    'password' in input &&
    typeof (input as any).email === 'string' &&
    typeof (input as any).password === 'string'
  )
}

// Error messages - generic to not reveal system information
export const genericErrorMessages = {
  invalidCredentials: 'Credenciales inválidas. Verifica tu email y contraseña.',
  accountLocked: 'Tu cuenta ha sido bloqueada temporalmente. Intenta nuevamente más tarde.',
  rateLimitExceeded: 'Demasiados intentos de login. Espera unos minutos antes de intentar nuevamente.',
  serverError: 'Error del servidor. Intenta nuevamente.',
  invalidInput: 'Los datos proporcionados no son válidos.',
  sessionExpired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  unauthorized: 'No tienes permisos para realizar esta acción.',
  suspiciousActivity: 'Se ha detectado actividad sospechosa. Por favor, contacta al administrador.'
} as const

export type ErrorMessageKey = keyof typeof genericErrorMessages