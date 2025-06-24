import { loginAction } from '@/actions/auth-login'
import { createServerClient } from '@supabase/ssr'
import { headers, cookies } from 'next/headers'

// Mock the dependencies
jest.mock('@supabase/ssr')
jest.mock('next/headers')
jest.mock('@/lib/rate-limiter')
jest.mock('@/lib/validation')
jest.mock('@/lib/device-sessions')

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockHeaders = headers as jest.MockedFunction<typeof headers>
const mockCookies = cookies as jest.MockedFunction<typeof cookies>

// Mock implementations
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
  },
}

const mockCookieStore = {
  getAll: jest.fn(() => []),
  set: jest.fn(),
}

const mockHeadersList = new Headers({
  'user-agent': 'Mozilla/5.0 Test Browser',
  'x-forwarded-for': '127.0.0.1',
})

// Mock rate limiter and security manager
const mockSecurityManager = {
  checkRateLimit: jest.fn(),
  recordLoginAttempt: jest.fn(),
  logSecurityEvent: jest.fn(),
}

const mockDeviceSessionManager = {
  createSession: jest.fn(),
}

const mockRememberMeCookieManager = {
  setRememberMeCookie: jest.fn(),
}

jest.mock('@/lib/rate-limiter', () => ({
  createSecurityManager: () => mockSecurityManager,
  getClientIdentifier: jest.fn(() => '127.0.0.1'),
  getClientInfo: jest.fn(() => ({
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 Test Browser',
    country: 'JP',
  })),
}))

jest.mock('@/lib/validation', () => ({
  loginSchema: {
    safeParse: jest.fn(),
  },
  InputSanitizer: {
    sanitizeEmail: jest.fn((email: string) => email),
    sanitizeString: jest.fn((str: string) => str),
  },
  SecurityValidator: {
    isValidUserAgent: jest.fn(() => true),
    hasInjectionPatterns: jest.fn(() => false),
  },
  genericErrorMessages: {
    invalidCredentials: 'Credenciales inválidas. Verifica tu email y contraseña.',
    rateLimited: 'Demasiados intentos. Intenta nuevamente más tarde.',
    suspiciousActivity: 'Actividad sospechosa detectada.',
    validationError: 'Datos de entrada inválidos',
  },
}))

jest.mock('@/lib/device-sessions', () => ({
  createDeviceSessionManager: () => mockDeviceSessionManager,
  RememberMeCookieManager: jest.fn(() => mockRememberMeCookieManager),
}))

describe('loginAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockHeaders.mockResolvedValue(mockHeadersList)
    mockCookies.mockResolvedValue(mockCookieStore)
    mockCreateServerClient.mockReturnValue(mockSupabaseClient as any)
    
    // Default successful rate limit check
    mockSecurityManager.checkRateLimit.mockResolvedValue({
      success: true,
      remaining: 5,
      resetTime: Date.now() + 60000,
    })
    
    // Default successful validation
    require('@/lib/validation').loginSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      },
    })
  })

  describe('Successful login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('rememberMe', 'false')

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
          session: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
        error: null,
      })

      mockSecurityManager.recordLoginAttempt.mockResolvedValue(undefined)
      mockSecurityManager.logSecurityEvent.mockResolvedValue(undefined)
      mockDeviceSessionManager.createSession.mockResolvedValue({
        id: 'session-123',
        deviceId: 'device-123',
      })

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockSecurityManager.recordLoginAttempt).toHaveBeenCalledWith(
        '127.0.0.1',
        true,
        expect.objectContaining({
          email: 'test@example.com',
          ipAddress: '127.0.0.1',
          userId: 'user-123',
        })
      )
    })

    it('should handle remember me option', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('rememberMe', 'true')

      require('@/lib/validation').loginSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true,
        },
      })

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: { access_token: 'token', refresh_token: 'refresh' },
        },
        error: null,
      })

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBe(true)
      expect(mockRememberMeCookieManager.setRememberMeCookie).toHaveBeenCalled()
    })
  })

  describe('Failed login', () => {
    it('should fail with invalid credentials', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'wrongpassword')

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBeFalsy()
      expect(result.error).toBe('Credenciales inválidas. Verifica tu email y contraseña.')
      expect(mockSecurityManager.recordLoginAttempt).toHaveBeenCalledWith(
        '127.0.0.1',
        false,
        expect.objectContaining({
          email: 'test@example.com',
          ipAddress: '127.0.0.1',
        })
      )
    })

    it('should fail when rate limited', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      mockSecurityManager.checkRateLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
      })

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.rateLimited).toBe(true)
      expect(result.error).toBe('Demasiados intentos. Intenta nuevamente más tarde.')
    })

    it('should fail with invalid input validation', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'invalid-email')
      formData.append('password', '123')

      require('@/lib/validation').loginSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          flatten: () => ({
            fieldErrors: {
              email: ['Email inválido'],
              password: ['Password muy corto'],
            },
          }),
        },
      })

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBeFalsy()
      expect(result.fieldErrors).toEqual({
        email: ['Email inválido'],
        password: ['Password muy corto'],
      })
    })

    it('should detect suspicious activity', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      require('@/lib/validation').SecurityValidator.isValidUserAgent.mockReturnValue(false)

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.suspiciousActivity).toBe(true)
      expect(result.error).toBe('Actividad sospechosa detectada.')
      expect(mockSecurityManager.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'invalid_user_agent',
          severity: 'medium',
        })
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      )

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBeFalsy()
      expect(result.error).toBeDefined()
    })

    it('should handle empty form data', async () => {
      // Arrange
      const formData = new FormData()

      require('@/lib/validation').loginSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          flatten: () => ({
            fieldErrors: {
              email: ['Email requerido'],
              password: ['Password requerido'],
            },
          }),
        },
      })

      // Act
      const result = await loginAction(formData)

      // Assert
      expect(result.success).toBeFalsy()
      expect(result.fieldErrors).toEqual({
        email: ['Email requerido'],
        password: ['Password requerido'],
      })
    })
  })
})