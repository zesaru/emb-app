/**
 * Email Templates Test Script
 * Run this to preview and test email templates
 */

import { render } from '@react-email/render';
import React from 'react';
import { CompensatoryRequestAdmin } from './components/email/templates/compensatory/compensatory-request-admin';
import { CompensatoryApprovedUser } from './components/email/templates/compensatory/compensatory-approved-user';
import { VacationRequestAdmin } from './components/email/templates/vacation/vacation-request-admin';
import { VacationApprovedUser } from './components/email/templates/vacation/vacation-approved-user';
import { BackupSuccess } from './components/email/templates/system/backup-success';
import fs from 'fs';
import path from 'path';

// Test data
const testData = {
  user: {
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
  },
  compensatory: {
    eventName: 'Trabajo extra feriado nacional',
    hours: 8,
    eventDate: new Date().toISOString(),
    approvedDate: new Date().toISOString(),
    newTotalHours: 24,
  },
  vacation: {
    startDate: new Date().toISOString(),
    finishDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    days: 5,
    approvedDate: new Date().toISOString(),
    newVacationBalance: 15,
  },
  urls: {
    approval: 'https://emb-app.vercel.app/compensatorios/approvec/test-123',
    dashboard: 'https://emb-app.vercel.app/',
    calendar: 'https://emb-app.vercel.app/calendar',
  },
};

async function generateTestEmails() {
  const outputDir = path.join(process.cwd(), 'test-emails-output');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🧪 Generating Email Templates Test Output...\n');

  // Test 1: Compensatory Request to Admin
  try {
    const emailHtml = await render(
      React.createElement(CompensatoryRequestAdmin, {
        userName: testData.user.name,
        userEmail: testData.user.email,
        eventName: testData.compensatory.eventName,
        hours: testData.compensatory.hours,
        eventDate: testData.compensatory.eventDate,
        approvalUrl: testData.urls.approval,
      })
    );

    fs.writeFileSync(
      path.join(outputDir, '1-compensatory-request-admin.html'),
      emailHtml
    );
    console.log('✅ Generated: 1-compensatory-request-admin.html');
  } catch (error) {
    console.error('❌ Error generating compensatory request admin:', error);
  }

  // Test 2: Compensatory Approved to User
  try {
    const emailHtml = await render(
      React.createElement(CompensatoryApprovedUser, {
        userName: testData.user.name,
        eventName: testData.compensatory.eventName,
        hours: testData.compensatory.hours,
        eventDate: testData.compensatory.eventDate,
        approvedDate: testData.compensatory.approvedDate,
        newTotalHours: testData.compensatory.newTotalHours,
        dashboardUrl: testData.urls.dashboard,
      })
    );

    fs.writeFileSync(
      path.join(outputDir, '2-compensatory-approved-user.html'),
      emailHtml
    );
    console.log('✅ Generated: 2-compensatory-approved-user.html');
  } catch (error) {
    console.error('❌ Error generating compensatory approved user:', error);
  }

  // Test 3: Vacation Request to Admin
  try {
    const emailHtml = await render(
      React.createElement(VacationRequestAdmin, {
        userName: testData.user.name,
        userEmail: testData.user.email,
        startDate: testData.vacation.startDate,
        finishDate: testData.vacation.finishDate,
        days: testData.vacation.days,
        approvalUrl: testData.urls.dashboard,
      })
    );

    fs.writeFileSync(
      path.join(outputDir, '3-vacation-request-admin.html'),
      emailHtml
    );
    console.log('✅ Generated: 3-vacation-request-admin.html');
  } catch (error) {
    console.error('❌ Error generating vacation request admin:', error);
  }

  // Test 4: Vacation Approved to User
  try {
    const emailHtml = await render(
      React.createElement(VacationApprovedUser, {
        userName: testData.user.name,
        startDate: testData.vacation.startDate,
        finishDate: testData.vacation.finishDate,
        days: testData.vacation.days,
        approvedDate: testData.vacation.approvedDate,
        newVacationBalance: testData.vacation.newVacationBalance,
        calendarUrl: testData.urls.calendar,
      })
    );

    fs.writeFileSync(
      path.join(outputDir, '4-vacation-approved-user.html'),
      emailHtml
    );
    console.log('✅ Generated: 4-vacation-approved-user.html');
  } catch (error) {
    console.error('❌ Error generating vacation approved user:', error);
  }

  // Test 5: Backup Success
  try {
    const emailHtml = await render(
      React.createElement(BackupSuccess, {
        backupDate: new Date().toISOString(),
        backupSize: '2.5 MB',
        backupType: 'full',
      })
    );

    fs.writeFileSync(
      path.join(outputDir, '5-backup-success.html'),
      emailHtml
    );
    console.log('✅ Generated: 5-backup-success.html');
  } catch (error) {
    console.error('❌ Error generating backup success:', error);
  }

  console.log(`\n📁 All test emails generated in: ${outputDir}`);
  console.log('🌐 Open the HTML files in your browser to preview the emails\n');

  return outputDir;
}

// Run the test
generateTestEmails()
  .then(() => {
    console.log('✅ Test generation complete!\n');
    console.log('💡 Tip: You can open these HTML files in different browsers to test compatibility');
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
