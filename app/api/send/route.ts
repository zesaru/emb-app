import { CompensatoryRequestAdmin } from '@/components/email/templates/compensatory/compensatory-request-admin';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';
import { requireCurrentUserAdmin } from '@/lib/auth/admin-check';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { getFromEmail } from '@/components/email/utils/email-config';
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

    // Enviar email de prueba usando la nueva plantilla
    const data = await resendInstance.emails.send({
      from: getFromEmail(),
      to: 'webdev@embassyofperuinjapan.org',
      subject: 'Test email - Nueva Plantilla',
      react: React.createElement(CompensatoryRequestAdmin, {
        userName: 'Usuario de Prueba',
        userEmail: 'test@example.com',
        eventName: 'Evento de Prueba',
        hours: 8,
        eventDate: new Date().toISOString(),
        approvalUrl: 'https://emb-app.vercel.app/',
      }),
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
