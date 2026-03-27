create or replace function public.approve_vacation_with_grants(
  p_vacation_id uuid,
  p_user_id uuid,
  p_days integer,
  p_approved_by uuid,
  p_approved_at timestamptz,
  p_legacy_balance integer,
  p_allow_legacy_fallback boolean default true
)
returns table (
  used_grant_balance boolean,
  remaining_balance integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested_days integer := greatest(coalesce(p_days, 0), 0);
  v_available_grant_balance integer := 0;
  v_remaining_days integer := 0;
  v_consumed integer := 0;
  v_legacy_balance integer := coalesce(p_legacy_balance, 0);
  v_grant record;
begin
  if v_requested_days <= 0 then
    raise exception 'INVALID_DAYS';
  end if;

  if exists (
    select 1
    from public.vacation_grant_consumptions
    where vacation_id = p_vacation_id
  ) then
    raise exception 'VACATION_ALREADY_CONSUMED';
  end if;

  select coalesce(sum(days_remaining), 0)::integer
  into v_available_grant_balance
  from public.vacation_grants
  where user_id = p_user_id
    and days_remaining > 0
    and expires_on > (p_approved_at at time zone 'utc')::date;

  if v_available_grant_balance >= v_requested_days then
    update public.vacations
    set approved = true,
        approved_by = p_approved_by,
        approved_date = p_approved_at,
        updated_at = now()
    where id = p_vacation_id;

    v_remaining_days := v_requested_days;

    for v_grant in
      select id, days_remaining
      from public.vacation_grants
      where user_id = p_user_id
        and days_remaining > 0
        and expires_on > (p_approved_at at time zone 'utc')::date
      order by expires_on asc, granted_on asc
      for update
    loop
      exit when v_remaining_days <= 0;

      v_consumed := least(v_grant.days_remaining::integer, v_remaining_days);

      insert into public.vacation_grant_consumptions (
        vacation_id,
        grant_id,
        user_id,
        days_used
      ) values (
        p_vacation_id,
        v_grant.id,
        p_user_id,
        v_consumed
      );

      update public.vacation_grants
      set days_remaining = days_remaining - v_consumed
      where id = v_grant.id;

      v_remaining_days := v_remaining_days - v_consumed;
    end loop;

    return query
    select true, (v_available_grant_balance - v_requested_days)::integer;
    return;
  end if;

  if p_allow_legacy_fallback and v_legacy_balance >= v_requested_days then
    update public.vacations
    set approved = true,
        approved_by = p_approved_by,
        approved_date = p_approved_at,
        updated_at = now()
    where id = p_vacation_id;

    update public.users
    set num_vacations = greatest(coalesce(num_vacations, 0) - v_requested_days, 0),
        updated_at = now()
    where id = p_user_id;

    return query
    select false, (v_legacy_balance - v_requested_days)::integer;
    return;
  end if;

  if p_allow_legacy_fallback then
    raise exception 'INSUFFICIENT_LEGACY_BALANCE';
  end if;

  raise exception 'INSUFFICIENT_GRANT_BALANCE';
end;
$$;

grant execute on function public.approve_vacation_with_grants(
  uuid,
  uuid,
  integer,
  uuid,
  timestamptz,
  integer,
  boolean
) to authenticated, service_role;
