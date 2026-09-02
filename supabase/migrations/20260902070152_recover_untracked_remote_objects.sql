-- Captures objects that already exist in production but were never stored in
-- this repository's migration chain. This migration is applied locally to
-- reproduce production and will be marked as applied remotely during the
-- controlled history-repair phase; it must not be pushed as new DDL there.

create table if not exists public.keepalive_pings (
  id integer primary key default 1,
  touched_at timestamptz not null default now(),
  constraint keepalive_pings_id_check check (id = 1)
);

alter table public.keepalive_pings enable row level security;

drop policy if exists "keepalive can be read" on public.keepalive_pings;
create policy "keepalive can be read"
on public.keepalive_pings
for select
to anon
using (id = 1);

drop policy if exists "keepalive can be touched" on public.keepalive_pings;
create policy "keepalive can be touched"
on public.keepalive_pings
for update
to anon
using (id = 1)
with check (id = 1);

insert into public.keepalive_pings (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists on_auth_users_insert on auth.users;
create trigger on_auth_users_insert
after insert on auth.users
for each row
execute function public.insert_user_in_public_table_for_each_new_user();
