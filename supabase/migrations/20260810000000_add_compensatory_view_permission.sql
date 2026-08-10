-- Explicit read-only permissions for scoped access to compensatory records.
-- This is intentionally separate from users.admin/users.role.

create table if not exists public.user_permissions (
  user_id uuid not null references public.users(id) on delete cascade,
  permission text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, permission)
);

alter table public.user_permissions enable row level security;

revoke all on public.user_permissions from anon;
grant select on public.user_permissions to authenticated;

drop policy if exists "Users can read own permissions" on public.user_permissions;
create policy "Users can read own permissions"
on public.user_permissions
for select
to authenticated
using (auth.uid() = user_id);

-- The calendar uses a server-only service-role query with a reduced field set.
-- The regular compensatorios pages are therefore restricted to the owner,
-- active admins, or users with the explicit read-only permission.
drop policy if exists "Enable read for auth users" on public.compensatorys;
create policy "Users can read own compensatorys or granted read access"
on public.compensatorys
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.admin = 'admin'
      and coalesce(u.is_active, true)
  )
  or exists (
    select 1
    from public.user_permissions p
    where p.user_id = auth.uid()
      and p.permission = 'compensatorys.view_all'
  )
);

insert into public.user_permissions (user_id, permission)
select id, 'compensatorys.view_all'
from public.users
where lower(email) = 'auemise@embperujapan.org'
on conflict (user_id, permission) do nothing;
