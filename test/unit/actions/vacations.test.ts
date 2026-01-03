/**
 * Pruebas unitarias para actions de vacaciones
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/utils/supabase/server'

// Mock del cliente Supabase
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Vacations Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getVacationsWithUser', () => {
    it('debería retornar array vacío si no hay autenticación', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('No autenticado'),
          }),
        },
      }
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      // Importar después del mock
      const getVacationsWithUser = (await import('@/actions/getVacationswithUser')).default

      const result = await getVacationsWithUser()

      expect(result).toEqual([])
    })

    it('debería llamar a Supabase con la query correcta', async () => {
      const mockData = [
        {
          id: '123',
          id_user: 'user-1',
          days: '5',
          approve_request: true,
          request_date: '2024-01-01',
          user1: { name: 'Test User', num_vacations: '30' },
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
        gte: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      }
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      const getVacationsWithUser = (await import('@/actions/getVacationswithUser')).default

      const result = await getVacationsWithUser()

      expect(mockSupabase.from).toHaveBeenCalledWith('vacations')
      expect(mockSupabase.select).toHaveBeenCalledWith('*, user1:users!vacations_id_user_fkey(*)')
      expect(result).toEqual(mockData)
    })
  })

  describe('getVacationswithUserById', () => {
    it('debería filtrar por id_user', async () => {
      const mockData = [
        {
          id: '123',
          id_user: 'user-1',
          days: '5',
          approve_request: true,
          request_date: '2024-01-01',
        },
      ]

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      }
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      const getVacationswithUserById = (await import('@/actions/getVacationswithUserById')).default

      const result = await getVacationswithUserById('user-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('vacations')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id_user', 'user-1')
      expect(mockSupabase.order).toHaveBeenCalledWith('request_date', { ascending: false })
      expect(result).toEqual(mockData)
    })
  })
})
