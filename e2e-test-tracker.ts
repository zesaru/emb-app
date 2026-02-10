/**
 * E2E Test Tracker
 *
 * This script helps track E2E testing progress in real-time.
 * Use it to log test results and generate reports.
 */

import fs from 'fs';
import path from 'path';

interface TestResult {
  testId: string;
  testName: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  observations: string[];
  emailTimestamps: string[];
  errors: string[];
}

class E2ETestTracker {
  private results: TestResult[] = [];
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'e2e-test-results.json');
    this.loadResults();
  }

  loadResults() {
    try {
      if (fs.existsSync(this.logFile)) {
        const data = fs.readFileSync(this.logFile, 'utf-8');
        this.results = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load previous results');
    }
  }

  saveResults() {
    fs.writeFileSync(this.logFile, JSON.stringify(this.results, null, 2));
  }

  startTest(testId: string, testName: string) {
    const test: TestResult = {
      testId,
      testName,
      status: 'running',
      startTime: new Date(),
      observations: [],
      emailTimestamps: [],
      errors: [],
    };

    // Remove previous result if exists
    this.results = this.results.filter(r => r.testId !== testId);
    this.results.push(test);
    this.saveResults();

    console.log(`\n🧪 Starting: ${testName}`);
    console.log(`   Test ID: ${testId}`);
    console.log(`   Time: ${test.startTime?.toISOString() || new Date().toISOString()}\n`);
  }

  addObservation(testId: string, observation: string) {
    const test = this.results.find(r => r.testId === testId);
    if (test) {
      test.observations.push(`[${new Date().toISOString()}] ${observation}`);
      this.saveResults();
      console.log(`   📝 ${observation}`);
    }
  }

  addEmailTimestamp(testId: string, description: string) {
    const test = this.results.find(r => r.testId === testId);
    if (test) {
      const timestamp = new Date().toISOString();
      test.emailTimestamps.push(`${description}: ${timestamp}`);
      this.saveResults();
      console.log(`   📧 Email received: ${description} at ${timestamp}`);
    }
  }

  addError(testId: string, error: string) {
    const test = this.results.find(r => r.testId === testId);
    if (test) {
      test.errors.push(`[${new Date().toISOString()}] ${error}`);
      this.saveResults();
      console.log(`   ❌ ERROR: ${error}`);
    }
  }

  passTest(testId: string) {
    const test = this.results.find(r => r.testId === testId);
    if (test) {
      test.status = 'passed';
      test.endTime = new Date();
      test.duration = test.endTime.getTime() - (test.startTime?.getTime() || 0);
      this.saveResults();

      const duration = (test.duration / 1000).toFixed(2);
      console.log(`\n✅ PASSED: ${test.testName}`);
      console.log(`   Duration: ${duration}s\n`);
    }
  }

  failTest(testId: string, reason: string) {
    const test = this.results.find(r => r.testId === testId);
    if (test) {
      test.status = 'failed';
      test.endTime = new Date();
      test.duration = test.endTime.getTime() - (test.startTime?.getTime() || 0);
      test.errors.push(reason);
      this.saveResults();

      const duration = (test.duration / 1000).toFixed(2);
      console.log(`\n❌ FAILED: ${test.testName}`);
      console.log(`   Reason: ${reason}`);
      console.log(`   Duration: ${duration}s\n`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 E2E TEST SUMMARY');
    console.log('='.repeat(80) + '\n');

    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const running = this.results.filter(r => r.status === 'running').length;
    const pending = this.results.filter(r => r.status === 'pending').length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🔄 Running: ${running}`);
    console.log(`⬜ Pending: ${pending}`);
    console.log(`\nSuccess Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%\n`);

    console.log('─'.repeat(80));
    console.log('DETAILED RESULTS:');
    console.log('─'.repeat(80) + '\n');

    this.results.forEach(result => {
      const icon = result.status === 'passed' ? '✅' :
                   result.status === 'failed' ? '❌' :
                   result.status === 'running' ? '🔄' : '⬜';

      console.log(`${icon} ${result.testName}`);
      console.log(`   ID: ${result.testId}`);
      console.log(`   Status: ${result.status}`);

      if (result.duration) {
        console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
      }

      if (result.observations.length > 0) {
        console.log(`   Observations: ${result.observations.length}`);
        result.observations.forEach(obs => console.log(`     - ${obs}`));
      }

      if (result.emailTimestamps.length > 0) {
        console.log(`   Emails: ${result.emailTimestamps.length}`);
        result.emailTimestamps.forEach(email => console.log(`     - ${email}`));
      }

      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.length}`);
        result.errors.forEach(error => console.log(`     - ${error}`));
      }

      console.log('');
    });

    console.log('='.repeat(80) + '\n');
  }

  generateReport() {
    const report = `
# E2E Test Report - ${new Date().toISOString()}

## Summary

- Total Tests: ${this.results.length}
- Passed: ${this.results.filter(r => r.status === 'passed').length}
- Failed: ${this.results.filter(r => r.status === 'failed').length}
- Running: ${this.results.filter(r => r.status === 'running').length}
- Pending: ${this.results.filter(r => r.status === 'pending').length}
- Success Rate: ${this.results.length > 0 ? ((this.results.filter(r => r.status === 'passed').length / this.results.length) * 100).toFixed(1) : 0}%

## Test Results

${this.results.map(result => `
### ${result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '🔄'} ${result.testName}

- **ID:** ${result.testId}
- **Status:** ${result.status}
${result.duration ? `- **Duration:** ${(result.duration / 1000).toFixed(2)}s` : ''}

${result.observations.length > 0 ? `
**Observations:**
${result.observations.map(obs => `- ${obs}`).join('\n')}
` : ''}

${result.emailTimestamps.length > 0 ? `
**Emails Received:**
${result.emailTimestamps.map(email => `- ${email}`).join('\n')}
` : ''}

${result.errors.length > 0 ? `
**Errors:**
${result.errors.map(error => `- ${error}`).join('\n')}
` : ''}
`).join('\n')}

---

Generated by E2E Test Tracker
EMB Development Team - ${new Date().toISOString()}
`;

    const reportFile = path.join(process.cwd(), 'E2E_TEST_REPORT.md');
    fs.writeFileSync(reportFile, report);
    console.log(`📄 Report generated: ${reportFile}`);
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const tracker = new E2ETestTracker();
  const command = process.argv[2];
  const testId = process.argv[3];
  const args = process.argv.slice(4);

  switch (command) {
    case 'start':
      tracker.startTest(testId, args[0]);
      break;

    case 'observe':
      tracker.addObservation(testId, args.join(' '));
      break;

    case 'email':
      tracker.addEmailTimestamp(testId, args.join(' '));
      break;

    case 'error':
      tracker.addError(testId, args.join(' '));
      break;

    case 'pass':
      tracker.passTest(testId);
      break;

    case 'fail':
      tracker.failTest(testId, args.join(' '));
      break;

    case 'summary':
      tracker.printSummary();
      break;

    case 'report':
      tracker.printSummary();
      tracker.generateReport();
      break;

    default:
      console.log(`
E2E Test Tracker - Commands:

  start <testId> <testName>      Start a new test
  observe <testId> <message>     Add observation
  email <testId> <description>   Log email received
  error <testId> <message>       Log error
  pass <testId>                  Mark test as passed
  fail <testId> <reason>         Mark test as failed
  summary                        Print test summary
  report                         Generate full report

Example Usage:

  npx tsx e2e-test-tracker.ts start test1 "Compensatorio Registro"
  npx tsx e2e-test-tracker.ts observe test1 "Usuario registró horas"
  npx tsx e2e-test-tracker.ts email test1 "Admin recibió solicitud"
  npx tsx e2e-test-tracker.ts pass test1
  npx tsx e2e-test-tracker.ts report
      `);
  }
}

export default E2ETestTracker;
