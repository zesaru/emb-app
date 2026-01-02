import { EmailTemplate } from '@/components/email-template';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';
import { requireCurrentUserAdmin } from '@/lib/auth/admin-check';
import { checkApiRateLimit } from '@/lib/rate-limit';
import React from 'react';

const resendInstance = new Resend(process.env.RESEND_API_KEY);

/**
 * API Route para enviar emails de prueba.
 *
 * SEGURIDAD:
 * - Requiere autenticación y rol de administrador
 * - Tiene rate limiting para prevenir abuso
 * - Solo acepta peticiones POST
 */
export async function POST(request: Request) {
  try {
    // Obtener IP del cliente para rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Rate limiting
    const rateLimitResult = checkApiRateLimit(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Verificar autenticación y autorización
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    try {
      await requireCurrentUserAdmin();
    } catch (error) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Enviar email
    const data = await resendInstance.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: 'webdev@embassyofperuinjapan.org',
      subject: 'Test email',
      react: React.createElement(EmailTemplate, { firstname: 'Jhon' } as any),
      text: '',
    });

    return NextResponse.json({
      success: true,
      data,
      rateLimit: {
        remaining: rateLimitResult.remaining,
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Métodos no permitidos
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
