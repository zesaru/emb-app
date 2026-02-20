/**
 * Pruebas unitarias para el flujo de solicitud de vacaciones
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { addVacation } from '@/actions/add-vacations'

const { sendEmailMock, resolveEmailRecipientsMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
  resolveEmailRecipientsMock: vi.fn((recipients: string | string[]) => recipients),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: sendEmailMock,
    }
  },
}))

vi.mock('@/components/email/utils/email-config', () => ({
  getFromEmail: vi.fn(() => 'EMB <noreply@example.com>'),
  buildUrl: vi.fn((path: string) => `https://emb-app.vercel.app${path}`),
  getSystemEmail: vi.fn(() => 'sistema@embperujapan.org'),
  resolveEmailRecipients: resolveEmailRecipientsMock,
}))

describe('addVacation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendEmailMock.mockResolvedValue({ id: 'mail-1' })
    resolveEmailRecipientsMock.mockImplementation((recipients: string | string[]) => recipients)
  })

  it('retorna error cuando no hay sesión', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as any)

    const response = await addVacation({
      start: '2099-05-10',
      finish: '2099-05-12',
      days: 2,
    })

    expect(response).toEqual({ success: false, error: 'No autenticado' })
  })

  it('rechaza fecha de inicio en el pasado', async () => {
    const response = await addVacation({
      start: '2000-01-01',
      finish: '2000-01-02',
      days: 1,
    })

    expect(response.success).toBe(false)
    expect(response.error).toContain('pasado')
  })

  it('rechaza cuando la fecha de fin es anterior a la de inicio', async () => {
    const response = await addVacation({
      start: '2099-05-12',
      finish: '2099-05-10',
      days: 2,
    })

    expect(response.success).toBe(false)
    expect(response.error).toContain('anterior')
  })

  it('retorna error cuando falla la RPC de inserción', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'rpc_failed' },
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: '123e4567-e89b-12d3-a456-426614174000', email: 'user@test.com' } },
        }),
      },
      rpc: rpcMock,
    } as any)

    const response = await addVacation({
      start: '2099-05-10',
      finish: '2099-05-12',
      days: 2,
    })

    expect(response).toEqual({
      success: false,
      error: 'No se pudo registrar la solicitud de vacaciones',
    })
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it('usa inserción directa cuando la RPC no existe en el schema cache', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST202',
        message: 'Could not find the function public.insertar_vacaciones',
      },
    })

    const limitMock = vi.fn().mockResolvedValue({
      data: [{ id: 'vac-1' }],
      error: null,
    })
    const selectMock = vi.fn(() => ({ limit: limitMock }))
    const insertMock = vi.fn(() => ({ select: selectMock }))
    const fromMock = vi.fn(() => ({ insert: insertMock }))

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: '123e4567-e89b-12d3-a456-426614174000', email: 'user@test.com' } },
        }),
      },
      rpc: rpcMock,
      from: fromMock,
    } as any)

    const response = await addVacation({
      start: '2099-05-10',
      finish: '2099-05-12',
      days: 2,
    })

    expect(response).toEqual({ success: true })
    expect(fromMock).toHaveBeenCalledWith('vacations')
    expect(insertMock).toHaveBeenCalled()
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
  })

  it('registra correctamente la solicitud y revalida rutas', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ users_name: 'Juan Pérez' }],
      error: null,
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: '123e4567-e89b-12d3-a456-426614174000', email: 'user@test.com' } },
        }),
      },
      rpc: rpcMock,
    } as any)

    const response = await addVacation({
      start: '2099-05-10',
      finish: '2099-05-12',
      days: 2,
    })

    expect(response).toEqual({ success: true })
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(resolveEmailRecipientsMock).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/vacaciones')
    expect(revalidatePath).toHaveBeenCalledWith('/vacaciones/new')
  })

  it('en modo test envía solo a usuaria y sistema', async () => {
    resolveEmailRecipientsMock.mockReturnValueOnce([
      'auemise@embperujapan.org',
      'sistema@embperujapan.org',
    ])

    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ users_name: 'Akiko Uemise' }],
      error: null,
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: '492a2566-a4cc-4099-9c6c-f018878f4f08', email: 'auemise@embperujapan.org' } },
        }),
      },
      rpc: rpcMock,
    } as any)

    const response = await addVacation({
      start: '2099-05-10',
      finish: '2099-05-12',
      days: 2,
    })

    expect(response).toEqual({ success: true })
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['auemise@embperujapan.org', 'sistema@embperujapan.org'],
      })
    )
  })

  it('no falla la solicitud si falla el envío de correo', async () => {
    sendEmailMock.mockRejectedValueOnce(new Error('email_failed'))

    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ users_name: 'Juan Pérez' }],
      error: null,
    })

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: '123e4567-e89b-12d3-a456-426614174000', email: 'user@test.com' } },
        }),
      },
      rpc: rpcMock,
    } as any)

    const response = await addVacation({
      start: '2099-05-10',
      finish: '2099-05-12',
      days: 2,
    })

    expect(response).toEqual({ success: true })
  })
})
