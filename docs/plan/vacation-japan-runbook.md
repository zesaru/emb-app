# Vacation Japan Runbook

## Objective

Execute the Japan vacation migration in production without deleting current data and with clear validation points after each step.

## Assumptions

- the branch already contains the additive migrations
- the application code already supports compatibility mode
- production backup is managed outside the repo
- schema deploy and app deploy can be executed separately

## Release Order

1. production backup confirmation
2. schema deploy
3. application deploy in compatibility mode
4. admin data completion
5. backfill execution
6. validation
7. activation of grant consumption

## Step 0: Pre-Flight

### Confirm branch and commit

```bash
git branch --show-current
git log --oneline -n 5
```

### Confirm tests are green locally

```bash
pnpm test
```

### Confirm local database can rebuild from migrations

```bash
pnpm dlx supabase@2.78.1 db reset
```

### Capture reference counts from production

Run these queries in production before deploying:

```sql
select 'users' as table_name, count(*) from public.users
union all
select 'vacations', count(*) from public.vacations
union all
select 'compensatorys', count(*) from public.compensatorys
union all
select 'attendances', count(*) from public.attendances;
```

Save the output in the release ticket or deployment notes.

## Step 1: Deploy Schema

### Scope

Deploy only additive migrations:

- `20260323000000_remote_public_schema.sql` only if required by environment history
- `202603250001_add_vacation_grants_foundation.sql`
- `202603260001_add_vacation_grant_consumptions.sql`
- `202603260002_add_dev_email_outbox.sql` only if desired outside local

### Rules

- do not run manual destructive SQL
- do not delete `num_vacations`
- do not backfill yet

### Validate schema immediately

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'users'
  and column_name in ('weekly_days', 'weekly_hours', 'attendance_eligible');

select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('vacation_grants', 'vacation_grant_consumptions');
```

### Re-check legacy counts

```sql
select 'users' as table_name, count(*) from public.users
union all
select 'vacations', count(*) from public.vacations
union all
select 'compensatorys', count(*) from public.compensatorys
union all
select 'attendances', count(*) from public.attendances;
```

Counts should not drop unexpectedly.

## Step 2: Deploy App In Compatibility Mode

### Scope

Deploy the application version that:

- can render users with or without grants
- still supports legacy `num_vacations`
- exposes admin fields for work pattern and attendance eligibility
- allows admin inspection of grants

### Validate after app deploy

Check these routes manually:

- `/login`
- `/admin/users`
- `/vacaciones/policy`
- `/vacaciones/[id]`

### Expected result

- no crashes for users with null grant data
- admin users can edit profile fields
- existing users keep working on the old balance

## Step 3: Complete Missing Admin Data

### Objective

Before any backfill, admins should complete minimum profile data for users that will enter the new engine.

### Required fields

- `hire_date`
- `weekly_days` and/or `weekly_hours`
- `attendance_eligible`

### Suggested first pass

Prioritize:

1. active non-diplomatic users
2. users with expected near-term grants
3. users whose current balance must be reviewed manually

## Step 4: Run Backfill

### Objective

Create initial grant records without rewriting legacy balances.

### Backfill rules

- use a defined `cutover date`
- do not delete or rewrite `vacations`
- do not overwrite `num_vacations`
- do not duplicate grants on rerun

### Recommended cutover policy

For V1:

- generate future-ready grant records
- use manual or initial adjustment notes where historic precision is uncertain

### Minimum validations after backfill

```sql
select
  user_id,
  granted_on,
  service_band,
  days_granted,
  days_remaining,
  expires_on,
  rule_type
from public.vacation_grants
order by user_id, granted_on desc;
```

```sql
select
  count(*) as total_grants,
  count(distinct user_id) as users_with_grants
from public.vacation_grants;
```

### Sample review checklist

Review at least:

- one active non-diplomatic user
- one diplomatic user
- one recent hire
- one user with incomplete historic certainty
- one user with non-trivial legacy balance

## Step 5: Activate Grant Consumption

### Objective

Only after backfill review, let approved vacations consume `vacation_grants`.

### Validate on a controlled sample first

Approve one vacation in a safe environment or limited production window and verify:

```sql
select
  c.vacation_id,
  c.user_id,
  c.grant_id,
  c.days_used,
  g.granted_on,
  g.days_remaining
from public.vacation_grant_consumptions c
join public.vacation_grants g on g.id = c.grant_id
order by c.created_at desc;
```

### Expected result

- one or more consumption rows inserted
- `days_remaining` reduced on the oldest valid grant first
- no unexpected modification of unrelated users

## Step 6: Operational Monitoring

After activation, monitor:

- grant creation errors
- approval errors
- admin complaints about mismatched balances
- users with missing work-pattern data

Suggested checks:

```sql
select count(*) from public.vacation_grants;
select count(*) from public.vacation_grant_consumptions;
select count(*) from public.users where weekly_days is null and weekly_hours is null;
select count(*) from public.users where attendance_eligible is null;
```

## Rollback

### If schema succeeded but app failed

- redeploy previous application version
- keep additive schema in place

### If backfill produced bad records

- stop backfill job
- disable grant-based behavior in app
- inspect generated grants before deleting anything

### If approval consumption behaves incorrectly

- disable the new approval path
- return temporarily to legacy balance behavior
- preserve `vacation_grant_consumptions` for audit

## Definition Of Done

The release is complete only when:

- schema is deployed
- app compatibility mode is live
- admin data minimum is present for target users
- backfill completed without duplicates
- grant consumption works on validated cases
- support/admin team can inspect and explain balances
