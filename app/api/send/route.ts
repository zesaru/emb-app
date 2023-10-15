import { EmailTemplate } from '../../../components/email-template';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import React from 'react';

const resendInstance = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const data = await resendInstance.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: 'webdev@embassyofperuinjapan.org',
      subject: 'Test email',
      react: React.createElement(EmailTemplate, { firstname: 'Jhon' } as any),
      text: '',
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
