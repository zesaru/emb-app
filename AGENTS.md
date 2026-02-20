# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, and API handlers (`app/api/*`).
- `actions/`: Server actions for domain operations (vacations, compensatory time, backups, auth flows).
- `components/`: Shared UI plus email templates (`components/email/*`).
- `lib/`: Cross-cutting utilities (validation, auth checks, backup services, helpers).
- `utils/supabase/`: Supabase client/server/middleware adapters.
- `test/`: Unit test setup, mocks, and suites (`test/unit/**`).
- `e2e/scenarios/`: Playwright end-to-end specs; auth state is stored in `e2e/.auth/`.
- `supabase/`, `scripts/`, `public/`: Local DB assets, automation scripts, and static files.

## Build, Test, and Development Commands
Use `pnpm` (CI runs with Node 24 + pnpm).
- `pnpm dev`: Start local app on `http://localhost:3000`.
- `pnpm build` / `pnpm start`: Build and run production output.
- `pnpm test`: Run unit tests (Vitest).
- `pnpm test:coverage`: Run unit tests with coverage output.
- `pnpm test:e2e`: Run Playwright E2E suite.
- `pnpm test:e2e -- e2e/scenarios/smoke-test.spec.ts`: Quick E2E smoke check.
- `pnpm gen-types`: Regenerate Supabase TypeScript types.
- `pnpm supabase:start` / `pnpm supabase:stop`: Start/stop local Supabase services.

## Coding Style & Naming Conventions
- TypeScript `strict` mode is enabled; keep changes type-safe.
- Use 2-space indentation and match the style of the touched file.
- Prefer `@/` absolute imports (configured in `tsconfig.json`).
- Tests use descriptive names and domain folders (`test/unit/actions/...`).
- Route folders are lowercase; route-specific UI belongs in local `_components/` directories.

## Testing Guidelines
- Unit tests: `test/**/*.{test,spec}.{ts,tsx}` with shared setup from `test/setup.ts` (`jsdom` environment).
- E2E tests: `e2e/scenarios/*.spec.ts`; keep `auth.setup.ts` dedicated to Playwright setup/login state.
- Before opening a PR, run `pnpm test`; run relevant E2E tests for affected flows (at minimum smoke tests for UI/auth changes).

## Commit & Pull Request Guidelines
- Follow the existing conventional commit pattern: `feat:`, `fix:`, `test:`, `chore:`, `ci:`, `perf:`, `security:`.
- Keep commit subjects short and imperative.
- PRs should include: purpose, scope, linked issue/context, and local test evidence.
- For UI updates, attach screenshots; for env/schema changes, update `.env.example` and related Supabase artifacts.

## Security & Configuration Tips
- Never commit secrets (`.env.local`, API keys, service tokens).
- Add new environment variables to `.env.example` with safe placeholders.
- Keep CI/deployment secrets in GitHub/Vercel settings, not in source files.
