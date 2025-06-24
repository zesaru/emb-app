import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verificar que existe la API key
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'RESEND_API_KEY no está configurada' 
      }, { status: 500 });
    }

    // Obtener datos del body (opcional)
    const body = await request.json().catch(() => ({}));
    const testEmail = body.email || 'webdev@embassyofperuinjapan.org';
    const testSubject = body.subject || 'Test Email - Embassy Management System';

    console.log('🧪 Enviando email de prueba a:', testEmail);

    // Enviar email de prueba
    const emailData = await resend.emails.send({
      from: process.env.EMBPERUJAPAN_EMAIL || 'Team <team@peruinjapan.com>',
      to: testEmail,
      subject: testSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🧪 Test Email</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Embassy Management System</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #28a745;">
            <h2 style="color: #495057; margin-top: 0;">✅ Email Configuration Test</h2>
            <p style="color: #6c757d; line-height: 1.6;">
              Este es un email de prueba para verificar que la configuración de Resend está funcionando correctamente.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #343a40; margin-top: 0;">📊 Detalles de la Prueba:</h3>
              <ul style="color: #6c757d; line-height: 1.8;">
                <li><strong>Fecha y Hora:</strong> ${new Date().toLocaleString('es-ES', { timeZone: 'Asia/Tokyo' })}</li>
                <li><strong>Zona Horaria:</strong> Asia/Tokyo (JST)</li>
                <li><strong>Email de Destino:</strong> ${testEmail}</li>
                <li><strong>Sistema:</strong> Embassy Management System</li>
                <li><strong>Estado:</strong> Funcionando correctamente ✅</li>
              </ul>
            </div>
            
            <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; border: 1px solid #b8daff;">
              <p style="margin: 0; color: #004085;">
                <strong>💡 Nota:</strong> Si recibes este email, significa que el sistema de notificaciones está configurado correctamente y listo para enviar notificaciones automáticas para aprobaciones de compensatorios y vacaciones.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
              Embassy of Peru in Japan - Email System Test<br>
              <strong>Embajada del Perú en Japón</strong>
            </p>
          </div>
        </div>
      `,
      text: `
Test Email - Embassy Management System

Este es un email de prueba para verificar que la configuración de Resend está funcionando correctamente.

Detalles de la Prueba:
- Fecha y Hora: ${new Date().toLocaleString('es-ES', { timeZone: 'Asia/Tokyo' })}
- Zona Horaria: Asia/Tokyo (JST)
- Email de Destino: ${testEmail}
- Sistema: Embassy Management System
- Estado: Funcionando correctamente ✅

Si recibes este email, significa que el sistema de notificaciones está configurado correctamente.

Embassy of Peru in Japan - Email System Test
Embajada del Perú en Japón
      `
    });

    console.log('✅ Email enviado exitosamente:', emailData);

    return NextResponse.json({
      success: true,
      message: 'Email de prueba enviado exitosamente',
      emailId: emailData.data?.id,
      sentTo: testEmail,
      timestamp: new Date().toISOString(),
      details: emailData
    });

  } catch (error) {
    console.error('❌ Error enviando email de prueba:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error enviando email de prueba',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET method para info básica
export async function GET() {
  const hasApiKey = !!process.env.RESEND_API_KEY;
  const hasEmbassyEmail = !!process.env.EMBPERUJAPAN_EMAIL;
  
  return NextResponse.json({
    status: 'Email Test Endpoint Ready',
    configuration: {
      resendApiKey: hasApiKey ? 'Configured ✅' : 'Missing ❌',
      embassyEmail: hasEmbassyEmail ? 'Configured ✅' : 'Missing ❌',
      endpoint: '/api/test-email'
    },
    usage: {
      method: 'POST',
      body: {
        email: 'recipient@example.com (optional)',
        subject: 'Custom subject (optional)'
      }
    },
    ready: hasApiKey
  });
}