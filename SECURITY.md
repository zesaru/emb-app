# Security Policy

## Scope
This project handles internal HR workflows for vacations, compensatory time, attendance, and admin operations. The main risks are environment separation, secrets handling, production data changes, and operational mistakes during deploys or migrations.

## Environment Rules
- Keep `production`, `preview`, `staging`, and `local` separated.
- Never reuse Supabase production credentials in preview or staging.
- Use different `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` per environment.
- Keep `EMAIL_DELIVERY_ENABLED=false` outside production unless there is an explicit reason to send real emails.

## Secrets
- Never commit secrets to the repository.
- Keep secrets only in environment managers such as Vercel, GitHub Actions, and Supabase.
- Use temporary, revocable tokens for debugging or operational review.
- Revoke temporary tokens after use.

## Runtime and Tooling
- Standardize on Node.js `24.x` across local development, CI, and Vercel.
- Use `pnpm` consistently and keep `pnpm-lock.yaml` updated.
- Do not mix package managers for the same workflow.

## Dependencies
- Review every new dependency before merging.
- Be extra careful with packages that:
  - run install scripts
  - download binaries
  - require network access during install
  - affect auth, build, or deployment
- Do not enable `ignore-scripts=true` globally by default for this repository. It may be useful in targeted audit workflows, but not as a blanket policy for the app.

## CI Expectations
- Minimum required checks before merge:
  - `pnpm test`
  - `pnpm run build`
- Run relevant Playwright tests for auth or UI-sensitive changes.
- Treat broken CI as blocking unless the failure is confirmed stale or unrelated.

## Database Changes
- Prefer additive migrations.
- Test schema changes in local and staging before production.
- Take a production backup before running migrations or backfills.
- Validate migrations with dry-runs and post-change SQL checks where possible.
- Avoid destructive SQL unless explicitly planned and reviewed.

## Production Operations
- Keep manual production edits rare and traceable.
- Use admin UI or SQL only for targeted corrections.
- If the same manual correction is needed repeatedly, convert it into application logic or a script.
- Record rationale in notes fields when adjusting grants or other sensitive operational records.

## Reporting
- Report suspected vulnerabilities privately to the maintainers.
- Do not open public issues containing secrets, tokens, database credentials, or exploitable details.
