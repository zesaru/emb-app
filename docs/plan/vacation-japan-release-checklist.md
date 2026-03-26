# Vacation Japan Release Checklist

## Goal

Deploy the new Japan vacation model without deleting or corrupting current production data.

## Release Strategy

Use three controlled releases:

1. schema only
2. compatibility-mode application
3. backfill + activation

Do not merge those steps into a single production deploy.

## Release 1: Schema Only

### Objective

Create the new structures without changing the current operational source of truth.

### Must Be Included

- `users.weekly_days`
- `users.weekly_hours`
- `users.attendance_eligible`
- `vacation_grants`
- `vacation_grant_consumptions`
- `dev_email_outbox` only if the team wants the same visibility in non-prod environments

### Must Not Happen

- no `drop column`
- no `truncate`
- no update that overwrites `num_vacations`
- no backfill inside the migration

### Pre-Deploy Checks

- [ ] confirm fresh production backup exists
- [ ] confirm migrations were applied successfully on local/staging
- [ ] confirm current production row counts were captured

Reference SQL:

```sql
select 'users' as table_name, count(*) from public.users
union all
select 'vacations', count(*) from public.vacations
union all
select 'compensatorys', count(*) from public.compensatorys
union all
select 'attendances', count(*) from public.attendances;
```

### Post-Deploy Checks

- [ ] verify new columns exist in `public.users`
- [ ] verify new tables exist
- [ ] verify row counts in legacy tables did not change unexpectedly

Reference SQL:

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

## Release 2: Compatibility-Mode App

### Objective

Deploy code that can read the new structures without requiring them to be fully populated.

### Expected Behavior

- users with no grants still work
- users with null work-pattern data still load
- `num_vacations` continues to exist as legacy balance
- admin can edit work-pattern fields safely
- grants UI is visible but does not require full historic migration yet

### Verification

- [ ] `/admin/users` loads
- [ ] `/vacaciones/[id]` loads for a user with no grants
- [ ] login and approval flows still work
- [ ] no unintended real emails are sent during validation

## Release 3: Backfill

### Objective

Generate initial structured grant data without deleting current business data.

### Backfill Rules

- use a defined `cutover date`
- do not delete existing `vacations`
- do not modify `num_vacations`
- do not create duplicate grants when re-run
- prefer conservative manual or initial adjustments when historic certainty is low

### Backfill Inputs

For each user, collect:

- `hire_date`
- `weekly_days`
- `weekly_hours`
- `attendance_eligible`
- current `num_vacations`
- whether the user should start with an initial manual adjustment instead of reconstructed legal history

### Idempotency Rule

The script must detect existing generated grants before inserting new ones.

Suggested guard:

- unique logical key by `user_id + granted_on + service_band`
- or explicit `notes` / metadata that marks generated cutover records

### Backfill Validation

- [ ] sample at least 5 real users
- [ ] include one diplomat
- [ ] include one non-diplomat
- [ ] include one user with missing historic certainty
- [ ] include one user with recent hire date
- [ ] include one user with expected old balance mismatch

Reference SQL:

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

## Activation Of Real Consumption

### Objective

Only after the backfill is validated, enable consumption of grants in vacation approvals.

### Preconditions

- [ ] backfill validated on sample users
- [ ] admin can inspect grants clearly
- [ ] fallback to legacy behavior remains available
- [ ] support team understands how to inspect grant history

### Verification

- [ ] approve one vacation in staging/local with active grants
- [ ] verify `days_remaining` decreases correctly
- [ ] verify one record is inserted into `vacation_grant_consumptions`

Reference SQL:

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

## Rollback

### Principle

Rollback should disable behavior, not destroy data.

### Safe Rollback Sequence

1. stop any backfill or scheduled grant job
2. redeploy app version that reads legacy balance only
3. keep additive schema in place
4. do not delete generated grant records during first rollback
5. investigate with preserved data

## Final Sign-Off

Do not mark migration complete until:

- [ ] schema is live
- [ ] compatibility app is live
- [ ] backfill is validated
- [ ] approvals consume grants correctly
- [ ] support/admin team knows how to inspect and correct grants
- [ ] decision about long-term role of `num_vacations` is documented
