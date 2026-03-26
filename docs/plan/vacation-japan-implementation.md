# Vacation Law Alignment Plan

## Goal

Align `emb-app` vacation logic with the core rules of Japanese annual paid leave law using a simple first version that is auditable and easy to improve later.

## Legal Baseline

We will use the following base rules as the legal reference:

- paid leave starts after `6 months` of continuous employment
- the employee must have at least `80%` attendance on scheduled working days
- leave increases with length of service

### Standard Schedule Reference

For employees working `5+ days per week` or `30+ hours per week`:

| Service length | Days granted |
| --- | --- |
| 6 months | 10 |
| 1 year 6 months | 11 |
| 2 years 6 months | 12 |
| 3 years 6 months | 14 |
| 4 years 6 months | 16 |
| 5 years 6 months | 18 |
| 6 years 6 months or more | 20 |

### Proportional Schedule Reference

For part-time employees, proportional leave applies:

| Weekly working days | Sequence |
| --- | --- |
| 4 days | 7, 8, 9, 10, 12, 13, 15 |
| 3 days | 5, 6, 6, 8, 9, 10, 11 |
| 2 days | 3, 4, 4, 5, 6, 6, 7 |
| 1 day | 1, 2, 2, 2, 3, 3, 3 |

### Additional Rules To Consider

- if an employee receives `10+` leave days, the employer must ensure `5` days are taken within `1 year`
- granted leave generally expires after `2 years`
- some companies also manage hourly leave depending on internal labor agreements

## Implementation Principle

Do not rely only on a single running balance like `num_vacations`.

Move toward an event-based model:

- leave grants
- leave usage
- leave expiration
- manual adjustments

This makes the system easier to explain, audit, and correct.

## MVP Scope

### Phase 1 Objective

Build the simplest usable model first:

- keep `hire_date`
- add work pattern data
- grant leave on legal milestone dates
- calculate balance from grants minus approved usage
- allow manual corrections for exceptional cases

### Minimum Data Model

Extend `users` with:

- `hire_date`
- `weekly_days`
- `weekly_hours`
- `attendance_eligible` optional manual flag for the `80%` attendance rule

Create a new table:

### `vacation_grants`

- `id`
- `user_id`
- `granted_on`
- `service_band`
- `days_granted`
- `days_remaining`
- `expires_on`
- `rule_type`
- `notes`
- `created_at`

Keep using `vacations` for leave requests and approvals.

## MVP Business Logic

At each grant date:

1. Check whether the employee has reached:
   - `6 months`
   - then every `12 months`
2. Determine the active work pattern at that time.
3. Choose the rule:
   - `weekly_days >= 5` or `weekly_hours >= 30` => `standard`
   - otherwise => `proportional`
4. Confirm attendance eligibility.
5. Create a `vacation_grants` record.
6. Set `expires_on = granted_on + 2 years`.

## Hard Case: Mixed Work Patterns

Example:

- first year working `3 days per week`
- later changed to `5 days per week`

### Recommended V1 Decision

Use the work pattern that is active on each grant date.

That means:

- do not recalculate all old grants automatically
- use the old schedule for old grant cycles
- use the new schedule for future grant cycles
- allow manual admin adjustment when historic records are incomplete

This is the safest and easiest first implementation.

## Migration Strategy

### Recommended Approach

Do not try to perfectly rebuild all historical leave from existing balances.

Instead:

1. choose a `cutover date`
2. keep the current balance as a starting adjustment
3. create future grants under the new engine
4. gradually improve historical accuracy only where needed

### Legacy Transition

For current users:

- keep `num_vacations` temporarily as legacy balance
- create an `initial_balance_adjustment` if needed
- use `vacation_grants` going forward

This avoids breaking the live system.

## Admin UX Requirements

Admins should be able to:

- view all grant records for a user
- see why each grant was issued
- view the next estimated grant date
- record work pattern changes
- apply manual adjustments
- inspect expiring balances

## Employee And Diplomat UX Requirements

Users should be able to:

- see current leave balance
- see granted leave history
- see next expected grant date
- read the policy page at `/vacaciones/policy`

## Phased Delivery

### Phase 1

- policy page
- work pattern fields
- grant table
- simple grant generator
- manual admin adjustments

### Phase 2

- work pattern history table
- automatic `80%` attendance calculation
- expiration logic
- `5 day` compliance tracking for grants of `10+`
- reminders and admin alerts

### Phase 3

- legal traceability per user
- simulation tool for future grant calculations
- reporting and compliance dashboards

## Open Decisions

Before coding the full engine, we must decide:

1. Should we store only `weekly_days`, only `weekly_hours`, or both?
2. Will `80% attendance` be automatic in V1 or admin-confirmed manually?
3. Do we recalculate historic balances or start from a cutover date?
4. Will `num_vacations` remain visible during transition, or become derived only from grants?

## Recommended Path

The easiest and safest delivery path is:

- use a cutover date
- store both `weekly_days` and `weekly_hours`
- manage `80% attendance` manually in V1
- create a grant-based engine for all future accruals
- keep manual overrides for special cases

## References

- Labour Standards Act of Japan, Article 39
  - https://www.japaneselawtranslation.go.jp/en/laws/view/3567
- Ministry of Health, Labour and Welfare (MHLW)
  - https://www.mhlw.go.jp/content/001395762.pdf
- MHLW leave promotion page
  - https://work-holiday.mhlw.go.jp/kyuuka-sokushin/jigyousya.html
