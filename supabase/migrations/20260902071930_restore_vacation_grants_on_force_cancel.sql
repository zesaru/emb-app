-- Restores each grant balance consumed by an approved vacation before a
-- super administrator force-cancels it. The previous implementation deleted
-- the consumption ledger rows without returning their days to the grants.

create or replace function public.super_admin_force_cancel_vacation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cancelled_at timestamptz;
  v_consumption record;
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

  -- Process grants in a stable order while the associated consumption rows
  -- are locked. This keeps the transaction short and minimizes lock-order
  -- contention with vacation approval.
  for v_consumption in
    select grant_id, days_used
    from public.vacation_grant_consumptions
    where vacation_id = p_id
    order by grant_id
    for update
  loop
    update public.vacation_grants
    set days_remaining = least(days_granted, days_remaining + v_consumption.days_used)
    where id = v_consumption.grant_id;

    if not found then
      raise exception 'VACATION_GRANT_NOT_FOUND';
    end if;
  end loop;

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
