-- Older profiles may have is_active = NULL and were historically treated as
-- active. Pending profiles are always explicitly false, so keep that contract.
create or replace function private.is_active_ready_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and coalesce(u.is_active, true)
      and u.provisioning_status = 'ready'
  );
$$;

create or replace function private.is_active_admin()
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
      and coalesce(u.is_active, true)
      and u.provisioning_status = 'ready'
  );
$$;

create or replace function private.prevent_unprivileged_role_change()
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
        and coalesce(actor.is_active, true)
        and actor.provisioning_status = 'ready'
    ) then
      raise exception 'Only an active super admin can change privileged roles'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
