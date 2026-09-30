alter table public.users
  add column provisioning_mode text;

alter table public.users
  add constraint users_provisioning_mode_check
  check (provisioning_mode is null or provisioning_mode in ('invite', 'temporary_password'));

create or replace function public.insert_user_in_public_table_for_each_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_mode text;
begin
  requested_mode := new.raw_user_meta_data ->> 'provisioning_mode';
  if requested_mode not in ('invite', 'temporary_password') then
    requested_mode := null;
  end if;

  insert into public.users (id, email, is_active, provisioning_status, provisioning_mode)
  values (new.id, new.email, false, 'pending', requested_mode);
  return new;
end;
$$;
