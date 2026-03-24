alter table public.users
add column if not exists position text;

comment on column public.users.position is 'Cargo del usuario';
