alter table public.users
add column if not exists is_diplomatic boolean not null default false;

comment on column public.users.is_diplomatic is 'Indica si el usuario es diplomatico';
