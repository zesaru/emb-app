/**
 * Send a Test Email via Resend
 *
 * This script sends a real test email to verify the email system is working.
 *
 * Usage:
 *   npx tsx send-test-email.ts <recipient-email>
 *
 * Example:
 *   npx tsx send-test-email.ts your-email@example.com
 */

import { readFileSync } from 'fs';
import { Resend } from 'resend';
import { CompensatoryRequestAdmin } from './components/email/templates/compensatory/compensatory-request-admin';
import { VacationApprovedUser } from './components/email/templates/vacation/vacation-approved-user';
import { getFromEmail, buildUrl } from './components/email/utils/email-config';
import React from 'react';

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envContent = readFileSync('.env.local', 'utf-8');
    const lines = envContent.split('\n');
    const env: Record<string, string> = {};

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=').trim();
        }
      }
    });

    // Set process.env variables
    Object.assign(process.env, env);
  } catch (error) {
    console.warn('Warning: Could not load .env.local file');
  }
}

// Load environment variables
loadEnv();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail(recipientEmail: string) {
  console.log('📧 Sending Test Email...\n');
  console.log(`From: ${getFromEmail()}`);
  console.log(`To: ${recipientEmail}\n`);

  try {
    // Test 1: Compensatory Request Admin
    console.log('🧪 Test 1: Compensatory Request to Admin...');

    const result1 = await resend.emails.send({
      from: getFromEmail(),
      to: recipientEmail,
      subject: `🧪 [TEST] Nueva Solicitud de Compensatorio`,
      react: React.createElement(CompensatoryRequestAdmin, {
        userName: 'Juan Pérez (Test User)',
        userEmail: 'juan.perez@example.com',
        eventName: 'Trabajo extra feriado nacional',
        hours: 8,
        eventDate: new Date().toISOString(),
        approvalUrl: buildUrl('/compensatorios/approvec/test-123'),
      }),
    });

    if (result1.error) {
      console.error('❌ Error:', result1.error);
      return;
    }

    console.log('✅ Email 1 sent successfully!');
    console.log(`   Message ID: ${result1.data?.id}\n`);

    // Wait a bit before sending second email
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Vacation Approved User
    console.log('🧪 Test 2: Vacation Approved to User...');

    const result2 = await resend.emails.send({
      from: getFromEmail(),
      to: recipientEmail,
      subject: `🧪 [TEST] ¡Tu Solicitud de Vacaciones Ha Sido Aprobada!`,
      react: React.createElement(VacationApprovedUser, {
        userName: 'Juan Pérez',
        startDate: new Date().toISOString(),
        finishDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        days: 5,
        approvedDate: new Date().toISOString(),
        newVacationBalance: 15,
        calendarUrl: buildUrl('/calendar'),
      }),
    });

    if (result2.error) {
      console.error('❌ Error:', result2.error);
      return;
    }

    console.log('✅ Email 2 sent successfully!');
    console.log(`   Message ID: ${result2.data?.id}\n`);

    console.log('✅ All test emails sent successfully!');
    console.log(`\n📬 Please check your inbox at: ${recipientEmail}`);
    console.log('💡 If you don\'t see the emails, check your spam folder.\n');

  } catch (error) {
    console.error('❌ Fatal error sending email:', error);
    process.exit(1);
  }
}

// Get recipient email from command line
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('❌ Error: Please provide a recipient email address');
  console.error('\nUsage: npx tsx send-test-email.ts <recipient-email>');
  console.error('Example: npx tsx send-test-email.ts your-email@example.com\n');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error('❌ Error: Invalid email address format');
  process.exit(1);
}

// Send the test email
sendTestEmail(recipientEmail);
