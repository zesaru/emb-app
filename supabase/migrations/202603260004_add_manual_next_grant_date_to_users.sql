alter table public.users
add column if not exists manual_next_grant_date date;

comment on column public.users.manual_next_grant_date is
'Manual next expected vacation grant date for exceptional cases that should not follow automatic cadence.';
