alter table public.vacation_grants
enable row level security;

drop policy if exists "Authenticated users can read vacation grants"
on public.vacation_grants;

create policy "Authenticated users can read vacation grants"
on public.vacation_grants
for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "Authenticated users can insert vacation grants"
on public.vacation_grants;

create policy "Authenticated users can insert vacation grants"
on public.vacation_grants
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.admin = 'admin'
      and coalesce(users.is_active, true)
  )
);

drop policy if exists "Authenticated users can update vacation grants"
on public.vacation_grants;

create policy "Authenticated users can update vacation grants"
on public.vacation_grants
for update
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.admin = 'admin'
      and coalesce(users.is_active, true)
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.admin = 'admin'
      and coalesce(users.is_active, true)
  )
);

alter table public.vacation_grant_consumptions
enable row level security;

drop policy if exists "Authenticated users can read vacation grant consumptions"
on public.vacation_grant_consumptions;

create policy "Authenticated users can read vacation grant consumptions"
on public.vacation_grant_consumptions
for select
to authenticated
using (auth.uid() is not null);

alter table public.dev_email_outbox
enable row level security;

drop policy if exists "Active admins can read dev email outbox"
on public.dev_email_outbox;

create policy "Active admins can read dev email outbox"
on public.dev_email_outbox
for select
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.admin = 'admin'
      and coalesce(users.is_active, true)
  )
);

drop policy if exists "Authenticated users can insert dev email outbox rows"
on public.dev_email_outbox;

create policy "Authenticated users can insert dev email outbox rows"
on public.dev_email_outbox
for insert
to authenticated
with check (
  auth.uid() is not null
  and (
    triggered_by_user_id is null
    or triggered_by_user_id = auth.uid()
    or exists (
      select 1
      from public.users
      where users.id = auth.uid()
        and users.admin = 'admin'
        and coalesce(users.is_active, true)
    )
  )
);

drop policy if exists "Active admins can update dev email outbox"
on public.dev_email_outbox;

create policy "Active admins can update dev email outbox"
on public.dev_email_outbox
for update
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.admin = 'admin'
      and coalesce(users.is_active, true)
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.admin = 'admin'
      and coalesce(users.is_active, true)
  )
);

drop policy if exists "Active admins can delete dev email outbox"
on public.dev_email_outbox;

create policy "Active admins can delete dev email outbox"
on public.dev_email_outbox
for delete
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.admin = 'admin'
      and coalesce(users.is_active, true)
  )
);
