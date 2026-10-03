# Repository Guidelines

## Application Context
- Internal staff management app for the Embassy of Peru in Japan: attendance, vacations, compensatory time, approvals, user administration, reports, and backups.
- Stack: Next.js 16 App Router, React 19, TypeScript, Supabase Auth/Postgres/Storage/Edge Functions, Tailwind CSS 3, and Radix UI components.
- Keep user-facing messages in Spanish and preserve `Asia/Tokyo` business-date handling. Distinguish calendar dates from timestamps; test date boundaries when changing calculations.
- Treat executable code, `package.json`, configuration, and migrations as the source of truth. `README.md` still describes the original starter; planning and E2E status documents may describe older behavior.

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, and API handlers (`app/api/*`).
- `app/(dashboard)/(routes)/`: Staff and admin screens; shared dashboard UI lives in `app/(dashboard)/_components/`.
- `app/auth/`: Sign-in, sign-out, and callback handlers. `proxy.ts` is the Next.js request entry point and delegates session handling to `utils/supabase/middleware.ts`.
- `actions/`: Server actions for domain operations (vacations, compensatory time, backups, auth flows).
- `actions/admin/users/` and `actions/admin/vacation-grants/`: User administration and vacation grant operations.
- `components/`: Shared UI plus email templates (`components/email/*`).
- `lib/`: Cross-cutting utilities (validation, auth checks, backup services, helpers).
- `lib/vacations/`: Grant eligibility, balances, and consumption; `lib/compensatorios/` and `lib/reporting/`: Reporting logic.
- `utils/supabase/`: Supabase client/server/middleware adapters.
- `types/database.type.ts`: Generated database types targeted by `pnpm gen-types`. Other database type files exist; check imports before editing or consolidating them.
- `store/`: Client state using Zustand.
- `test/`: Unit test setup, mocks, and suites (`test/unit/**`).
- `e2e/scenarios/`: Playwright end-to-end specs; auth state is stored in `e2e/.auth/`.
- `supabase/migrations/`, `supabase/seed.sql`, `supabase/functions/`: Database history, local seed, and Edge Functions. Edge Functions are excluded from the root TypeScript check.
- `scripts/`, `public/`, `docs/plan/`: Operational scripts, static files, and domain/release context.

## Build, Test, and Development Commands
Use Node 24 (`.nvmrc` and `package.json`) and pnpm 10, matching CI.
- `pnpm install --frozen-lockfile`: Install the committed dependency graph.
- `pnpm dev`: Start local app on `http://localhost:3000`.
- `bash scripts/dev-local-emb.sh`: Start isolated local Supabase and launch Next.js using its local credentials without rewriting `.env.local`; requires Docker.
- `pnpm build` / `pnpm start`: Build and run production output.
- `pnpm test`: Run Vitest interactively in local development. Use `pnpm test --run` for a single non-interactive run.
- `pnpm test --run test/unit/actions/add-vacations.test.ts`: Run a focused unit suite.
- `pnpm test:invitation:local`: Run invitation recovery against isolated local Supabase with simulated email delivery.
- `pnpm test:invitation:e2e:local`: Run the real admin form, delivery failure/retry, password setup, and invite acceptance against local Supabase. Requires local services; starts its own Next.js server on port 3000 and removes disposable accounts and temporary email artifacts.
- `pnpm test:coverage --run`: Request coverage; verify the matching Vitest coverage provider is installed (it is not currently declared in `package.json`).
- `pnpm exec tsc --noEmit`: Check application TypeScript types.
- `pnpm test:e2e`: Run Playwright E2E suite.
- `pnpm exec playwright test e2e/scenarios/smoke-test.spec.ts --project=unauthenticated`: Smoke check without the authenticated setup dependency.
- `pnpm exec playwright install chromium`: Install the browser needed by the configured projects.
- `pnpm gen-types`: Regenerate `types/database.type.ts` from the **linked** Supabase project; verify the target first. This does not generate from the local database.
- `pnpm supabase:start` / `pnpm supabase:stop`: Start/stop local Supabase services.
- No lint script is currently defined. Do not report `pnpm lint` as a completed check.
- `env:dev` and `env:staging` use PowerShell and overwrite `.env.local`; do not assume they work on macOS/Linux.

## Local Environment & Database Work
- Local Supabase project ID is `emb-app`; API port `55421`, Postgres `55422`, and Studio `55423` are configured in `supabase/config.toml`.
- `pnpm dev` uses the existing environment. `pnpm dev:all` starts Supabase but does not inject local credentials; use the local launcher above when targeting the isolated database.
- Add schema, RPC, and RLS changes as new migrations; preserve already applied migration history. Check the installed CLI's help before choosing flags.
- Keep SQL RPC contracts, action calls, and generated types aligned. Review type-generation diffs for unrelated schema drift.
- `pnpm supabase:reset` resets the local database and seeds it. Restore, sync, and backfill scripts can also change data; inspect their target and options before running them. These are not routine validation commands for unrelated edits.
- Preserve RLS and database authorization alongside application checks. Do not replace a failed user-scoped query with a service-role query merely to bypass a permissions error.

## Coding Style & Naming Conventions
- TypeScript `strict` mode is enabled; keep changes type-safe.
- Use 2-space indentation and match the style of the touched file.
- Prefer `@/` absolute imports (configured in `tsconfig.json`).
- Tests use descriptive names and domain folders (`test/unit/actions/...`).
- Route folders are lowercase; route-specific UI belongs in local `_components/` directories.
- Reuse existing `components/ui/` primitives and form/validation patterns (`react-hook-form`, Zod, `lib/validation/schemas.ts`).
- Use Sonner through the existing `ToasterProvider` for mutation success/error feedback; `test/unit/components/mutation-feedback-contract.test.ts` enforces this convention.
- Preserve server action result contracts and revalidate affected paths after successful mutations. Keep privileged code out of client components.
- Dependency overrides exist in both `package.json` and `pnpm-workspace.yaml`; keep them consistent when intentionally changing an override and update `pnpm-lock.yaml` with pnpm.

## Authorization & Domain Invariants
- Reuse `lib/auth/admin-check.ts`: admin checks use `users.admin = 'admin'`; super-admin checks use `users.role = 'super_admin'`. They are distinct checks. Use active-user guards for operations requiring an active account.
- `compensatorys.view_all` in `user_permissions` grants read access via `lib/auth/compensatory-permissions.ts`; it does not grant approval or administrative privileges.
- Authenticate and authorize each protected action/handler on the server; hidden controls and proxy redirects are not sufficient authorization. Derive the acting user from the verified session.
- Use the request-scoped Supabase server adapter for user operations. `lib/supabase/admin.ts` exposes a privileged service-role client for authorized server operations only.
- Vacation grants coexist with legacy `users.num_vacations`. Preserve compatibility unless the task explicitly changes it; consult `lib/vacations/`, the current migrations, and relevant unit tests.
- Vacation approval uses `approve_vacation_with_grants` to approve and consume balance atomically. Preserve duplicate-processing protection and grant restoration on forced cancellation; do not split these into independent client writes.
- Preserve grant expiry boundaries and consumption ordering (earliest expiry first). Cover insufficient balance, repeat approval/cancellation, and legacy fallback when modifying these flows.

## Email & Scheduled Jobs
- Reuse `sendOrCaptureEmail` in `lib/email/dev-email-outbox.ts`, React Email templates, and recipient/URL helpers in `components/email/utils/email-config.ts`.
- `EMAIL_DELIVERY_ENABLED=false` captures messages in `dev_email_outbox`; `EMAIL_TEST_MODE` changes recipients and does not disable delivery. Mock email delivery in unit tests.
- Keep notification failures separate from successful business mutations where the existing flow does so.
- Scheduled endpoints are configured in `vercel.json`; preserve bearer-token checks using `lib/cron/verify-cron-secret.ts` when changing cron handlers.

## Testing Guidelines
- Unit tests: `test/**/*.{test,spec}.{ts,tsx}` with shared setup from `test/setup.ts` (`jsdom` environment).
- E2E tests: `e2e/scenarios/*.spec.ts`; keep `auth.setup.ts` dedicated to Playwright setup/login state.
- Use Vitest APIs (`vi`), Testing Library, and existing mocks in `test/mocks/`; do not introduce Jest configuration for this suite.
- For code changes, run focused tests, then `pnpm test --run` before opening a PR. Run relevant E2E tests for affected flows (at minimum the unauthenticated smoke command for UI/auth changes), and type/build checks when applicable.
- Documentation-only changes need reference/command checks and `git diff --check`, not an application build or E2E run.
- Playwright reads `BASE_URL` (default `http://localhost:3000`) but its `webServer` still starts a local dev server on port 3000. Do not assume setting `BASE_URL` disables that startup.
- Auth setup currently creates only `e2e/.auth/admin.json`, using `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`; the `authenticated-user` project expects `user.json`, which this setup does not create. Supply dedicated test accounts/state before running those projects; do not rely on hardcoded fallback credentials.
- Run mutating E2E scenarios against a controlled test environment. Report missing credentials/services or existing failures explicitly rather than treating skipped checks as passing.
- CI runs unit tests on PRs and main pushes; E2E runs only the `unauthenticated` project on main pushes. Workflow comments mentioning production do not override the actual Playwright configuration.

## Commit & Pull Request Guidelines
- Follow the existing conventional commit pattern: `feat:`, `fix:`, `test:`, `chore:`, `ci:`, `perf:`, `security:`.
- Keep commit subjects short and imperative.
- PRs should include: purpose, scope, linked issue/context, and local test evidence.
- For UI updates, attach screenshots; for env/schema changes, update the tracked environment template and related Supabase artifacts.

## Security & Configuration Tips
- Never commit secrets (`.env.local`, API keys, service tokens).
- The tracked environment template is `.env.staging.example`; `.env.example` does not currently exist. Document new variables with safe placeholders in the appropriate tracked template.
- Keep CI/deployment secrets in GitHub/Vercel settings, not in source files.
- Never commit Supabase service-role keys, auth session JSON, database dumps/backups, or test artifacts containing personal data. Do not print environment file contents or credentials while diagnosing configuration.
