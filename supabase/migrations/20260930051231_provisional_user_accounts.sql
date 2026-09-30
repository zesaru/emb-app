-- Existing accounts stay ready. New Auth accounts start inactive until the
-- application has persisted their full profile and finished provisioning.
alter table public.users
  add column provisioning_status text not null default 'ready';

alter table public.users
  add constraint users_provisioning_status_check
  check (provisioning_status in ('pending', 'ready'));

create or replace function public.insert_user_in_public_table_for_each_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, is_active, provisioning_status)
  values (new.id, new.email, false, 'pending');
  return new;
end;
$$;
