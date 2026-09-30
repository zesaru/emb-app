-- JWTs obtained from invitation links bypass the app's password login route.
-- A restrictive policy prevents provisional accounts from using exposed data.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_active_ready_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.is_active = true
      and u.provisioning_status = 'ready'
  );
$$;

revoke all on function private.is_active_ready_user() from public;
grant execute on function private.is_active_ready_user() to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'attendances', 'compensatorys', 'vacations',
    'vacation_grants', 'vacation_grant_consumptions', 'user_permissions',
    'dev_email_outbox', 'device_sessions', 'login_attempts', 'security_events'
  ] loop
    execute format(
      'create policy "Only ready accounts can access data" on public.%I as restrictive for all to authenticated using ((select private.is_active_ready_user())) with check ((select private.is_active_ready_user()))',
      table_name
    );
  end loop;
end;
$$;

-- App-level role checks are not enough when authenticated admins can call the
-- Data API directly. Protect privileged role transitions in the database too.
create function private.prevent_unprivileged_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (old.admin is distinct from new.admin)
    or (
      old.role is distinct from new.role
      and (old.role in ('admin', 'super_admin') or new.role in ('admin', 'super_admin'))
    ) then
    if coalesce(auth.role(), '') in ('service_role', 'supabase_admin')
      or session_user = 'postgres' then
      return new;
    end if;

    if not exists (
      select 1 from public.users actor
      where actor.id = (select auth.uid())
        and actor.role = 'super_admin'
        and actor.admin = 'admin'
        and actor.is_active = true
        and actor.provisioning_status = 'ready'
    ) then
      raise exception 'Only an active super admin can change privileged roles'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_unprivileged_role_change() from public;

create trigger users_prevent_unprivileged_role_change
before update on public.users
for each row
execute function private.prevent_unprivileged_role_change();
