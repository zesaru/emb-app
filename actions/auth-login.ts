'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido').min(1, 'El email es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').min(1, 'La contraseña es requerida'),
})

export async function loginAction(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Validate form data
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      error: 'Datos de entrada inválidos',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Don't reveal whether user exists or not
      return {
        error: 'Credenciales inválidas. Verifica tu email y contraseña.',
      }
    }

    // Successful login
    return { success: true }
  } catch (error) {
    return {
      error: 'Error del servidor. Intenta nuevamente.',
    }
  }
}

export async function loginWithCredentials(email: string, password: string) {
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error('Credenciales inválidas. Verifica tu email y contraseña.')
  }

  redirect('/')
}