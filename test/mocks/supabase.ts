import { vi } from 'vitest'

// Mock del cliente Supabase para Server Components/Actions
export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
}

// Mock de chain methods
const mockQueryBuilder = {
  select: vi.fn(function(this: any) { return this; }),
  insert: vi.fn(function(this: any) { return this; }),
  update: vi.fn(function(this: any) { return this; }),
  delete: vi.fn(function(this: any) { return this; }),
  eq: vi.fn(function(this: any) { return this; }),
  order: vi.fn(function(this: any) { return this; }),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  range: vi.fn(),
}

// Asignar los chain methods al mock
Object.assign(mockSupabaseClient.from, mockQueryBuilder)

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Tipos para usar en tests
export type MockSupabaseClient = typeof mockSupabaseClient

// Helper para resetear mocks
export function resetMocks() {
  mockSupabaseClient.auth.getUser.mockReset()
  mockSupabaseClient.auth.getSession.mockReset()
  mockSupabaseClient.from.mockReset()
}
