import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { getSystemEmail, resolveEmailRecipients } from '@/components/email/utils/email-config'

const ORIGINAL_ENV = { ...process.env }

describe('email-config recipients', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('mantiene destinatario original fuera de modo test', () => {
    process.env.EMAIL_TEST_MODE = 'false'

    expect(resolveEmailRecipients('admin@embperujapan.org')).toBe('admin@embperujapan.org')
  })

  it('en modo test usa EMAIL_TEST_USER y correo de sistema', () => {
    process.env.EMAIL_TEST_MODE = 'true'
    process.env.EMAIL_TEST_USER = 'auemise@embperujapan.org'
    process.env.EMBPERUJAPAN_EMAIL = 'sistema@embperujapan.org'

    expect(resolveEmailRecipients('admin@embperujapan.org', 'otro@embperujapan.org')).toEqual([
      'auemise@embperujapan.org',
      'sistema@embperujapan.org',
    ])
  })

  it('en modo test usa el correo de contexto cuando no hay EMAIL_TEST_USER', () => {
    process.env.EMAIL_TEST_MODE = 'true'
    delete process.env.EMAIL_TEST_USER
    process.env.EMBPERUJAPAN_EMAIL = 'sistema@embperujapan.org'

    expect(resolveEmailRecipients('admin@embperujapan.org', 'akiko@embperujapan.org')).toEqual([
      'akiko@embperujapan.org',
      'sistema@embperujapan.org',
    ])
  })

  it('usa fallback de sistema cuando EMBPERUJAPAN_EMAIL no está definido', () => {
    delete process.env.EMBPERUJAPAN_EMAIL

    expect(getSystemEmail()).toBe('sistema@embperujapan.org')
  })
})
