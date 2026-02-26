/**
 * Pruebas unitarias para schemas de validación
 */

import { describe, it, expect } from 'vitest'
import {
  adminUserCreateSchema,
  vacationSchema,
  compensatorySchema,
  compensatoryRequestSchema,
  userUpdateSchema,
} from '@/lib/validation/schemas'

describe('vacationSchema', () => {
  it('valida datos correctos', () => {
    const data = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      start: '2025-01-01',
      finish: '2025-01-05',
      days: 5,
    }
    const result = vacationSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('rechaza días negativos', () => {
    const data = {
      start: '2025-01-01',
      finish: '2025-01-05',
      days: -1,
    }
    const result = vacationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rechaza más de 30 días', () => {
    const data = {
      start: '2025-01-01',
      finish: '2025-02-10',
      days: 31,
    }
    const result = vacationSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('30')
    }
  })

  it('acepta fechas como objetos Date', () => {
    const data = {
      start: new Date('2025-01-01T00:00:00.000Z'),
      finish: new Date('2025-01-05T00:00:00.000Z'),
      days: 5,
    }
    const result = vacationSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})

describe('compensatorySchema', () => {
  it('valida datos correctos', () => {
    const data = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      eventName: 'Trabajo extra',
      eventDate: '2025-01-15',
      hours: 8,
      tTimeStart: '09:00',
      tTimeFinish: '18:00',
    }
    const result = compensatorySchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('rechaza más de 12 horas por día', () => {
    const data = {
      eventName: 'Trabajo extra',
      eventDate: '2025-01-15',
      hours: 13,
    }
    const result = compensatorySchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('12')
    }
  })

  it('requiere nombre del evento', () => {
    const data = {
      eventDate: '2025-01-15',
      hours: 8,
    }
    const result = compensatorySchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('compensatoryRequestSchema', () => {
  it('valida solicitud correcta', () => {
    const data = {
      dob: '2025-01-20',
      time_start: '09:00',
      time_finish: '18:00',
      hours: 8,
    }
    const result = compensatoryRequestSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('acepta dob como Date por compatibilidad con el formulario', () => {
    const data = {
      dob: new Date('2025-01-20T00:00:00.000Z'),
      time_start: '09:00',
      time_finish: '18:00',
      hours: 8,
    }
    const result = compensatoryRequestSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('acepta hours como string por compatibilidad con input HTML', () => {
    const data = {
      dob: '2025-01-20',
      time_start: '09:00',
      time_finish: '18:00',
      hours: '8',
    }
    const result = compensatoryRequestSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.hours).toBe(8)
    }
  })

  it('requiere todos los campos', () => {
    const data = {
      hours: 8,
    }
    const result = compensatoryRequestSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rechaza formato de hora inválido', () => {
    const data = {
      dob: '2025-01-20',
      time_start: '9:00',
      time_finish: '18:00',
      hours: 8,
    }
    const result = compensatoryRequestSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rechaza cuando hora fin no es posterior a hora inicio', () => {
    const data = {
      dob: '2025-01-20',
      time_start: '18:00',
      time_finish: '09:00',
      hours: 8,
    }
    const result = compensatoryRequestSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('time_finish'))).toBe(true)
    }
  })

  it('rechaza cuando las horas exceden el rango horario', () => {
    const data = {
      dob: '2025-01-20',
      time_start: '09:00',
      time_finish: '13:00',
      hours: 8,
    }
    const result = compensatoryRequestSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('hours'))).toBe(true)
    }
  })
})

describe('userUpdateSchema', () => {
  it('valida actualización con UUID correcto', () => {
    const data = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Juan Pérez',
    }
    const result = userUpdateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('rechaza UUID inválido', () => {
    const data = {
      id: 'not-a-uuid',
      name: 'Juan Pérez',
    }
    const result = userUpdateSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('valida email correctamente', () => {
    const data = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'invalid-email',
    }
    const result = userUpdateSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('adminUserCreateSchema', () => {
  it('valida creación por invitación', () => {
    const data = {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      provisioningMode: 'invite',
      numVacations: 15,
      numCompensatorys: 4,
    }

    const result = adminUserCreateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('requiere contraseña temporal cuando aplica', () => {
    const data = {
      email: 'user@example.com',
      name: 'User Test',
      role: 'user',
      provisioningMode: 'temporary_password',
    }

    const result = adminUserCreateSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
