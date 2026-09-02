alter table public.users
  add column if not exists invitation_status text not null default 'accepted',
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists invitation_accepted_at timestamptz,
  add column if not exists invitation_last_sent_at timestamptz;

update public.users
set invitation_status = 'accepted'
where invitation_status is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_invitation_status_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users add constraint users_invitation_status_check
      check (invitation_status in ('pending', 'accepted'));
  end if;
end $$;

create index if not exists users_pending_invitation_idx
  on public.users (invitation_last_sent_at desc)
  where invitation_status = 'pending';

comment on column public.users.invitation_status is 'Estado de activacion de una invitacion administrada: pendiente o aceptada';
