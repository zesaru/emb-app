# Vercel CI/CD + Playwright E2E Testing Guide

Complete implementation of Vercel best practices for E2E testing with Playwright and GitHub Actions.

## 🏗️ Architecture

### CI/CD Pipeline Flow

```
GitHub Push/PR
    ↓
GitHub Actions Triggered
    ↓
┌─────────────────────────────────────┐
│ Job 1: Deploy to Vercel (Preview)  │
│ - Uses Vercel Action               │
│ - Deploys preview URL              │
│ - Outputs preview URL              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Job 2: E2E Tests (4 shards)        │
│ - Waits for deployment             │
│ - Runs tests on preview URL        │
│ - Parallel execution (4 workers)   │
│ - Uploads test reports             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Job 3: Unit Tests                  │
│ - Runs Vitest tests                │
│ - Uploads coverage report          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Job 4: Comment on PR               │
│ - Posts test results to PR         │
│ - Includes preview URL             │
└─────────────────────────────────────┘
```

## 🚀 Best Practices Implemented

### 1. **Parallel Execution** ⚡
- 4 shards running simultaneously
- Each shard runs ~1/4 of the tests
- Reduces total execution time by ~75%

### 2. **Preview Deployment Testing** 🎯
- Tests run on actual Vercel preview deployment
- Catches environment-specific issues
- Tests real deployment, not localhost

### 3. **Job Dependencies** 🔗
- E2E tests wait for deployment to complete
- Unit tests run in parallel with E2E
- PR comment depends on both test suites

### 4. **Cancellation Policy** 🛑
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
- Cancels old runs when new commits are pushed
- Saves CI/CD minutes and costs

### 5. **Retry Logic** 🔄
```yaml
retries: process.env.CI ? 2 : 0
```
- Retries failed tests 2 times in CI
- No retries locally for faster feedback

### 6. **Reporting** 📊
- HTML reports for detailed analysis
- JSON reports for programmatic access
- Artifacts retained for 7 days

### 7. **Failure Handling** ❌
- Uploads test results on failure
- Screenshots automatically captured
- Video recordings in CI only

## 📋 Setup Instructions

### Step 1: Configure Vercel Secrets

Go to your Vercel project settings and add these environment variables:

#### Required Secrets:
```
VERCEL_TOKEN - Your Vercel authentication token
VERCEL_ORG_ID - Your Vercel organization ID
VERCEL_PROJECT_ID - Your Vercel project ID
```

#### Get Vercel Credentials:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Get project info
vercel link

# View project configuration
cat .vercel/project.json
```

### Step 2: Configure GitHub Secrets

Go to: `https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions`

Add the following secrets:

| Secret | Value | Description |
|--------|-------|-------------|
| `VERCEL_TOKEN` | Your Vercel token | From Vercel Settings → Tokens |
| `VERCEL_ORG_ID` | Your org ID | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Your project ID | From `.vercel/project.json` |

### Step 3: Configure E2E Test Credentials (Optional)

For automated testing, add test user credentials:

```bash
# In Vercel project settings or GitHub Secrets
E2E_ADMIN_EMAIL=test-admin@yourdomain.com
E2E_ADMIN_PASSWORD=secure-test-password
```

**Security Note**: Use test-only accounts, never real user credentials!

### Step 4: Enable GitHub Actions

The workflow is already configured in `.github/workflows/e2e-tests.yml`

It will automatically run on:
- Pull requests to `main`
- Pushes to `main`
- Manual workflow dispatch

## 🔧 Configuration Files

### `.github/workflows/e2e-tests.yml`

**Key Features**:
- ✅ Deploys to Vercel preview
- ✅ Runs E2E tests in 4 shards
- ✅ Runs unit tests in parallel
- ✅ Comments results on PR
- ✅ Uploads artifacts

### `playwright.config.ts`

**CI Optimizations**:
```typescript
// More workers in CI
workers: process.env.CI ? 4 : 2

// Retries in CI
retries: process.env.CI ? 2 : 0

// Video recording in CI only
video: process.env.CI ? 'retain-on-failure' : 'off'

// Dynamic BASE_URL
baseURL: process.env.BASE_URL || 'http://localhost:3000'
```

## 🧪 Running Tests Locally

### Standard E2E Tests:
```bash
# Run all unauthenticated tests
npx playwright test --project=unauthenticated

# Run specific test file
npx playwright test smoke-test.spec.ts

# Run with UI
npx playwright test --ui
```

### With Auth Setup:
```bash
# Setup authentication first
npx playwright test --project=setup

# Then run authenticated tests
npx playwright test --project=authenticated-admin
```

### Unit Tests:
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage
```

## 📊 Test Results

### Viewing Results:

**Locally**:
```bash
# Open HTML report
npx playwright show-report
```

**In GitHub Actions**:
1. Go to Actions tab
2. Click on workflow run
3. Download artifacts:
   - `playwright-report-shard-*` - HTML reports
   - `test-results-shard-*` - Screenshots & videos

### PR Comments:

After each PR, you'll see a comment like:

```markdown
## ✅ Test Results Completed
- **Unit Tests**: Passed ✓
- **E2E Tests**: Completed on preview deployment
- **Preview URL**: https://your-app.vercel.app
```

## 🎯 Testing Strategy

### Smoke Tests (6 tests)
- Run on every PR
- Fast execution (~5-10 seconds)
- Tests basic functionality

### Authenticated Tests (~95 tests)
- Run on preview deployments
- Full user flows
- All major features

### Unit Tests (17 tests)
- Run in parallel with E2E
- Fast feedback
- Business logic validation

## ⚡ Performance Optimization

### Execution Time (Approximate):

| Test Suite | Tests | Time (4 shards) |
|------------|-------|-----------------|
| Smoke Tests | 6 | ~30 seconds |
| Authenticated Tests | ~95 | ~3-5 minutes |
| Unit Tests | 17 | ~30 seconds |
| **Total** | **~118** | **~4-6 minutes** |

### Cost Optimization:

- **Concurrency**: 4 workers (adjustable)
- **Cancellation**: Old runs cancelled automatically
- **Artifact Retention**: 7 days (storage savings)
- **Video Recording**: CI only (local disabled)

## 🔍 Troubleshooting

### Tests Failing on Preview URL

**Problem**: Tests pass locally but fail on preview

**Solutions**:
1. Check environment variables are set in Vercel
2. Verify database connectivity
3. Check for hardcoded localhost URLs
4. Review preview deployment logs

### Rate Limiting Issues

**Problem**: "Too many attempts" error in CI

**Solutions**:
1. Use session state persistence (already implemented)
2. Configure separate Supabase project for testing
3. Add delays between test runs
4. Use API mocking (see `e2e/RATE-LIMITING-SOLUTION.md`)

### Timeout Errors

**Problem**: Tests timing out in CI

**Solutions**:
1. Increase timeout in `playwright.config.ts`
2. Optimize slow tests
3. Check preview deployment performance
4. Use sharding to reduce per-shard load

## 📚 Resources

### Official Documentation:
- [Running E2E Tests After Vercel Preview Deployments](https://vercel.com/kb/guide/how-can-i-run-end-to-end-tests-after-your-vercel-preview-deployment) - Official Vercel Guide
- [Using GitHub Actions with Vercel](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel) - GitHub Actions Integration
- [15 Best Practices for Playwright Testing in 2026](https://www.browserstack.com/guide/playwright-best-practices) - Updated Best Practices
- [Regression Testing Strategy for Vercel Preview Deployments](https://www.getautonoma.com/blog/regression-testing-vercel-preview-deployments) - Comprehensive Strategy Guide

### Example Implementations:
- [vercel-playwright-end-to-end-tests](https://github.com/mxschmitt/vercel-playwright-end-to-end-tests) - Working Example
- [Playwright CI Documentation](https://playwright.dev/docs/ci) - Official Playwright CI Guide

## 🎉 Summary

This implementation follows Vercel and Playwright best practices for 2026:

✅ Preview deployment testing
✅ Parallel execution (4 shards)
✅ Job optimization and dependencies
✅ Automatic retries
✅ Comprehensive reporting
✅ Artifact management
✅ PR integration
✅ Cost optimization
✅ Fast feedback loops

**Result**: Reliable, fast, and cost-effective E2E testing pipeline!
