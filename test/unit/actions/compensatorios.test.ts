/**
 * Pruebas unitarias para actions de compensatorios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/utils/supabase/server'

// Mock del cliente Supabase
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Compensatorios Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCompensatoriosWithUser', () => {
    it('debería retornar array vacío si no hay autenticación', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('No autenticado'),
          }),
        },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      // Importar después del mock
      const getCompensatoriosWithUser = (await import('@/actions/getCompensatorioswithUser')).default

      const result = await getCompensatoriosWithUser()

      expect(result).toEqual([])
    })

    it('debería llamar a Supabase con la query correcta', async () => {
      const mockData = [
        {
          id: '123',
          user_id: 'user-1',
          hours: '8',
          event_date: '2024-01-01',
          type: 'register',
          user1: { name: 'Test User', num_compensatorys: '40' },
        },
      ]

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      }
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      const getCompensatoriosWithUser = (await import('@/actions/getCompensatorioswithUser')).default

      const result = await getCompensatoriosWithUser()

      expect(mockSupabase.from).toHaveBeenCalledWith('compensatorys')
      expect(mockSupabase.gte).toHaveBeenCalledWith('hours', 0)
      expect(mockSupabase.order).toHaveBeenCalledWith('event_date', { ascending: false })
      expect(result).toEqual(mockData)
    })
  })

  describe('getCompensatoriosbyId', () => {
    it('debería filtrar por user_id', async () => {
      const mockData = [
        {
          id: '123',
          user_id: 'user-1',
          hours: '8',
          event_date: '2024-01-01',
          type: 'register',
        },
      ]

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      }
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      const getCompensatoriosbyId = (await import('@/actions/getCompensatoriosbyId')).default

      const result = await getCompensatoriosbyId('user-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('compensatorys')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(result).toEqual(mockData)
    })
  })
})
