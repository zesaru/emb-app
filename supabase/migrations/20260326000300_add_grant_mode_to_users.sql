alter table public.users
add column if not exists grant_mode text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_grant_mode_check'
  ) then
    alter table public.users
    add constraint users_grant_mode_check
    check (grant_mode in ('automatic', 'manual'));
  end if;
end
$$;

comment on column public.users.grant_mode is 'Modo operativo para cálculo de grants: automatic o manual';
