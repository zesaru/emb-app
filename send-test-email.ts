/**
 * Send a Test Email via the Microsoft 365 Supabase Edge Function
 *
 * This script hits the deployed `send-email` Edge Function directly
 * (same path the app uses via sendOrCaptureEmail) to verify the M365
 * Graph API integration is working end to end.
 *
 * Usage:
 *   npx tsx send-test-email.ts <recipient-email>
 *
 * Example:
 *   npx tsx send-test-email.ts your-email@example.com
 */

import { readFileSync } from 'fs';
import { render } from '@react-email/render';
import { CompensatoryRequestAdmin } from './components/email/templates/compensatory/compensatory-request-admin';
import { VacationApprovedUser } from './components/email/templates/vacation/vacation-approved-user';
import { buildUrl } from './components/email/utils/email-config';
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const internalToken = process.env.SUPABASE_INTERNAL_FUNCTION_SECRET;

if (!supabaseUrl || !anonKey || !internalToken) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_INTERNAL_FUNCTION_SECRET in .env.local');
  process.exit(1);
}

async function sendViaEdgeFunction(to: string, subject: string, react: React.ReactElement) {
  const html = await render(react);

  const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      'x-internal-token': internalToken!,
    },
    body: JSON.stringify({ to: [to], subject, html }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || `Edge function returned ${response.status}`);
  }
}

async function sendTestEmail(recipientEmail: string) {
  console.log('📧 Sending Test Email via M365 (Graph API)...\n');
  console.log(`To: ${recipientEmail}\n`);

  try {
    console.log('🧪 Test 1: Compensatory Request to Admin...');
    await sendViaEdgeFunction(
      recipientEmail,
      '🧪 [TEST] Nueva Solicitud de Compensatorio',
      React.createElement(CompensatoryRequestAdmin, {
        userName: 'Juan Pérez (Test User)',
        userEmail: 'juan.perez@example.com',
        eventName: 'Trabajo extra feriado nacional',
        hours: 8,
        eventDate: new Date().toISOString(),
        approvalUrl: buildUrl('/compensatorios/approvec/test-123'),
      }),
    );
    console.log('✅ Email 1 sent successfully!\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🧪 Test 2: Vacation Approved to User...');
    await sendViaEdgeFunction(
      recipientEmail,
      '🧪 [TEST] ¡Tu Solicitud de Vacaciones Ha Sido Aprobada!',
      React.createElement(VacationApprovedUser, {
        userName: 'Juan Pérez',
        startDate: new Date().toISOString(),
        finishDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        days: 5,
        approvedDate: new Date().toISOString(),
        newVacationBalance: 15,
        calendarUrl: buildUrl('/calendar'),
      }),
    );
    console.log('✅ Email 2 sent successfully!\n');

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
