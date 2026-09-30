-- The previous UPDATE policy queried public.users from a policy on that same
-- table. A private definer helper avoids infinite RLS recursion.
create function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.admin = 'admin'
      and u.is_active = true
      and u.provisioning_status = 'ready'
  );
$$;

revoke all on function private.is_active_admin() from public;
grant execute on function private.is_active_admin() to authenticated;

drop policy if exists "Only active admins can update users" on public.users;
create policy "Only active admins can update users"
on public.users
for update
to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));
