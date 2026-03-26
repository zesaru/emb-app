# Vacation Law Alignment Backlog

## Objective

Translate the vacation law alignment plan into concrete implementation tasks that can be executed incrementally without destabilizing production.

## Phase 1: Data Foundations

### Goal

Prepare the minimum schema and admin data needed for a safe cutover.

### Tasks

- [ ] Add `weekly_days` to `public.users`
- [ ] Add `weekly_hours` to `public.users`
- [ ] Add optional `attendance_eligible` to `public.users`
- [ ] Create `public.vacation_grants`
- [ ] Define a `cutover date` for the new leave engine
- [ ] Decide whether `num_vacations` remains temporary legacy data
- [ ] Add admin UI fields for:
  - [ ] weekly working days
  - [ ] weekly working hours
  - [ ] attendance eligibility override

### Deliverable

A user profile can store the minimum work pattern required to decide whether the standard or proportional vacation table applies.

### Production-Safe Migration Tasks

- [ ] Confirm production backup exists before any schema deploy
- [ ] Deploy additive schema only
- [ ] Keep `num_vacations` unchanged during schema rollout
- [ ] Validate that the app still works with users that have no grants yet
- [ ] Prepare a separate idempotent backfill process
- [ ] Validate backfill on local or staging using recent production-like data
- [ ] Document rollback path that disables the new engine without deleting data

## Phase 2: Grant Engine MVP

### Goal

Create a simple grant-based leave engine for future accruals.

### Tasks

- [ ] Create a function/service that decides:
  - [ ] service band
  - [ ] standard vs proportional rule
  - [ ] number of granted days
- [ ] Generate `vacation_grants` from the cutover date onward
- [ ] Set `expires_on` for each grant
- [ ] Keep manual attendance eligibility for V1
- [ ] Add admin action to issue or regenerate grants safely
- [ ] Add admin view to inspect grants per user

### Deliverable

Future vacation accrual is recorded as structured grant records instead of relying only on a single balance field.

## Phase 3: Balance Calculation

### Goal

Move balance calculation toward grants minus approved usage.

### Tasks

- [ ] Decide how approved vacation requests consume grant balances
- [ ] Consume oldest valid grants first
- [ ] Ignore expired grants in available balance
- [ ] Add manual balance adjustment support
- [ ] Build a per-user grant history view
- [ ] Display next expected grant date

### Deliverable

The visible vacation balance becomes traceable and auditable.

## Phase 4: Mixed Work Pattern Support

### Goal

Handle employees whose working schedule changes over time.

### Tasks

- [ ] Create `user_work_patterns`
- [ ] Add:
  - [ ] `user_id`
  - [ ] `effective_from`
  - [ ] `weekly_days`
  - [ ] `weekly_hours`
  - [ ] optional notes
- [ ] Resolve active work pattern at each grant date
- [ ] Use work pattern valid on the grant date
- [ ] Add admin UI for work pattern history

### Deliverable

Employees who started with part-time schedules and later moved to full-time schedules can be handled correctly over time.

## Phase 5: Legal Compliance Enhancements

### Goal

Improve legal accuracy after the engine is stable.

### Tasks

- [ ] Model or calculate `80% attendance`
- [ ] Add `5 day use obligation` tracking for grants of `10+`
- [ ] Add expiration tracking and alerts
- [ ] Build compliance dashboard for admins
- [ ] Add warning states for incomplete historical data

### Deliverable

The system becomes more aligned with operational compliance needs, not only with grant calculation.

## Key Product Decisions

- [ ] Store both `weekly_days` and `weekly_hours`
- [ ] Use a `cutover date` instead of attempting perfect historical reconstruction
- [ ] Keep `80% attendance` manual in V1
- [ ] Use the work pattern active at each grant date
- [ ] Allow admin overrides for exceptional cases

## Recommended Build Order

1. [ ] Add user work pattern fields
2. [ ] Create `vacation_grants`
3. [ ] Build grant calculation service
4. [ ] Build admin grant inspection UI
5. [ ] Add balance consumption logic
6. [ ] Add manual adjustment support
7. [ ] Add work pattern history
8. [ ] Add attendance and compliance rules

## Immediate Next Task

The next concrete engineering task should be:

- [ ] Create migrations for:
  - [ ] `users.weekly_days`
  - [ ] `users.weekly_hours`
  - [ ] `users.attendance_eligible` (optional)
  - [ ] `vacation_grants`

This is the correct starting point for implementation.

## Migration Execution Order

- [ ] Step 1: deploy schema additions only
- [ ] Step 2: deploy compatibility-mode application code
- [ ] Step 3: complete missing admin profile data where needed
- [ ] Step 4: run controlled backfill
- [ ] Step 5: validate real-user samples
- [ ] Step 6: activate grant consumption in approvals
- [ ] Step 7: decide when `num_vacations` stops being the operational source of truth
