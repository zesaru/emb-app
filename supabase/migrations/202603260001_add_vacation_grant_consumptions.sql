create table if not exists public.vacation_grant_consumptions (
  id uuid primary key default gen_random_uuid(),
  vacation_id uuid not null references public.vacations(id) on delete cascade,
  grant_id uuid not null references public.vacation_grants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  days_used integer not null check (days_used > 0),
  consumed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (vacation_id, grant_id)
);

create index if not exists vacation_grant_consumptions_vacation_id_idx
  on public.vacation_grant_consumptions (vacation_id);

create index if not exists vacation_grant_consumptions_grant_id_idx
  on public.vacation_grant_consumptions (grant_id);

create index if not exists vacation_grant_consumptions_user_id_idx
  on public.vacation_grant_consumptions (user_id);
