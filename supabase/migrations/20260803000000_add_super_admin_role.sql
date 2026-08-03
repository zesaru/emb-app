-- Introduces a "super_admin" tier on top of the existing "admin" role.
--
-- users.admin cannot be repurposed to hold 'super_admin' as a value: ~18
-- RLS policies and RPCs across prior migrations (enable_rls_for_public_
-- grant_and_outbox_tables, fix_rls_privilege_escalation,
-- fix_approve_vacation_with_grants, add_admin_cancel_compensatorio) do an
-- exact string match `admin = 'admin'`. A super admin therefore keeps
-- admin = 'admin' (so all of that keeps working unchanged) and is
-- distinguished purely via users.role = 'super_admin', mirroring the
-- existing admin/role duplication already handled in
-- lib/users/user-mappers.ts.

update public.users
set role = 'super_admin',
    admin = 'admin'
where email = 'cmurillo@embperujapan.org';

-- Lets a super admin force-cancel a compensatorio request regardless of
-- approval state (admin_cancel_compensatorio, 20260731020000, only allows
-- cancelling still-pending ones). Compensatorio balances are computed by
-- summing approved+non-cancelled rows (see saldo columns in
-- compensatorios/[id]/_components/columns.tsx), so soft-cancelling an
-- already-approved row is enough to correct the balance -- no separate
-- ledger table to reconcile, unlike vacations.

create or replace function public.super_admin_force_cancel_compensatorio(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cancelled_at timestamptz;
begin
  if not exists (
    select 1 from public.users
    where users.id = auth.uid()
      and users.role = 'super_admin'
      and coalesce(users.is_active, true)
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select cancelled_at
  into v_cancelled_at
  from public.compensatorys
  where id = p_id
  for update;

  if not found then
    raise exception 'COMPENSATORIO_NOT_FOUND';
  end if;

  if v_cancelled_at is not null then
    raise exception 'ALREADY_CANCELLED';
  end if;

  update public.compensatorys
  set cancelled_at = now(),
      cancelled_by = auth.uid()
  where id = p_id;
end;
$$;

revoke all on function public.super_admin_force_cancel_compensatorio(uuid) from public, anon;
grant execute on function public.super_admin_force_cancel_compensatorio(uuid) to authenticated;

-- Same for vacations. Unlike compensatorios, an approved vacation has
-- consumed a vacation_grants balance via a vacation_grant_consumptions row
-- (see approve_vacation_with_grants, 202603260001_add_vacation_grant_
-- consumptions.sql). Soft-cancelling the vacation alone would leave that
-- consumption in place and understate the user's remaining balance, so the
-- matching consumption row is deleted here to restore it.

create or replace function public.super_admin_force_cancel_vacation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cancelled_at timestamptz;
begin
  if not exists (
    select 1 from public.users
    where users.id = auth.uid()
      and users.role = 'super_admin'
      and coalesce(users.is_active, true)
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select cancelled_at
  into v_cancelled_at
  from public.vacations
  where id = p_id
  for update;

  if not found then
    raise exception 'VACATION_NOT_FOUND';
  end if;

  if v_cancelled_at is not null then
    raise exception 'ALREADY_CANCELLED';
  end if;

  delete from public.vacation_grant_consumptions
  where vacation_id = p_id;

  update public.vacations
  set cancelled_at = now(),
      cancelled_by = auth.uid()
  where id = p_id;
end;
$$;

revoke all on function public.super_admin_force_cancel_vacation(uuid) from public, anon;
grant execute on function public.super_admin_force_cancel_vacation(uuid) to authenticated;
