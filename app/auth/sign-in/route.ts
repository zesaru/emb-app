import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { checkLoginRateLimit, resetRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Route handler para inicio de sesión.
 *
 * SEGURIDAD:
 * - Implementa rate limiting para prevenir ataques de fuerza bruta
 * - Limita a 5 intentos por IP cada 15 minutos
 * - Resetea el contador después de un login exitoso
 */
export async function POST(request: Request) {
  const requestUrl = new URL(request.url);

  // Obtener IP del cliente para rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Verificar rate limiting
  const rateLimitResult = checkLoginRateLimit(ip);

  if (!rateLimitResult.success) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=Too many attempts. Please try again later.`,
      { status: 301 }
    );
  }

  const formData = await request.formData();
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  // Validación básica de entrada
  if (!email || !password || email.length > 255 || password.length > 100) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=Invalid email or password`,
      { status: 301 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Rate limit: mostrar intentos restantes en el error (opcional)
    const remaining = rateLimitResult.remaining ?? 0;
    const errorMessage = remaining < 2
      ? `Could not authenticate user. ${remaining + 1} attempts remaining.`
      : 'Could not authenticate user';

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorMessage)}`,
      { status: 301 }
    );
  }

  // Login exitoso: resetear rate limit para esta IP
  resetRateLimit(ip);

  return NextResponse.redirect(requestUrl.origin, {
    status: 301,
  });
}
