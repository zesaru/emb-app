-- The owner/pg_cron executes these routines directly. No Data API RPC is exposed.
create schema if not exists private;

create table private.vacation_grant_job_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  finished_at timestamptz not null default clock_timestamp(),
  business_date date not null,
  summary jsonb not null,
  details jsonb not null
);
alter table private.vacation_grant_job_runs enable row level security;
revoke all on private.vacation_grant_job_runs from public, anon, authenticated, service_role;

create function private.vacation_grant_anniversary(p_hire_date date, p_index integer)
returns date
language sql immutable strict security invoker
set search_path = ''
as $$
  select (p_hire_date + make_interval(months => 6 + 12 * p_index))::date;
$$;

create function private.vacation_grant_terms(
  p_hire_date date, p_granted_on date, p_weekly_days smallint, p_weekly_hours numeric
)
returns table(service_band text, days_granted integer, rule_type text, expires_on date)
language plpgsql immutable security invoker
set search_path = ''
as $$
declare
  v_band integer;
  v_days integer[];
  v_bands text[] := array['6_months','1_year_6_months','2_years_6_months',
    '3_years_6_months','4_years_6_months','5_years_6_months','6_years_6_months_plus'];
begin
  if p_hire_date is null or p_granted_on is null then return; end if;
  for i in reverse 6..0 loop
    if p_granted_on >= private.vacation_grant_anniversary(p_hire_date, i) then
      v_band := i;
      exit;
    end if;
  end loop;
  if v_band is null then return; end if;

  if p_weekly_days >= 5 or p_weekly_hours >= 30 then
    rule_type := 'standard';
    v_days := array[10,11,12,14,16,18,20];
  elsif p_weekly_days between 1 and 4 then
    rule_type := 'proportional';
    v_days := case p_weekly_days
      when 4 then array[7,8,9,10,12,13,15]
      when 3 then array[5,6,6,8,9,10,11]
      when 2 then array[3,4,4,5,6,6,7]
      when 1 then array[1,2,2,2,3,3,3] end;
  else return;
  end if;
  service_band := v_bands[v_band + 1];
  days_granted := v_days[v_band + 1];
  expires_on := (p_granted_on + interval '2 years')::date;
  return next;
end;
$$;

create function private.plan_vacation_grants(
  p_today date default (now() at time zone 'Asia/Tokyo')::date,
  p_user_id uuid default null
)
returns table(user_id uuid, status text, reason text, grants jsonb)
language plpgsql stable security invoker
set search_path = ''
as $$
declare
  v_user record;
  v_latest date;
  v_index integer;
  v_date date;
  v_terms record;
begin
  if p_today is null then raise exception 'INVALID_REFERENCE_DATE'; end if;
  for v_user in
    select u.* from public.users u
    where u.is_active = true and u.is_diplomatic = false
      and (p_user_id is null or u.id = p_user_id)
    order by u.id
  loop
    user_id := v_user.id;
    grants := '[]'::jsonb;
    status := 'blocked';
    reason := null;
    if v_user.grant_mode = 'manual' then
      status := 'skipped'; reason := 'manual_mode'; return next; continue;
    end if;
    if v_user.grant_mode is not null and v_user.grant_mode <> 'automatic' then
      reason := 'invalid_mode'; return next; continue;
    end if;
    if v_user.attendance_eligible = false then
      reason := 'attendance_ineligible'; return next; continue;
    end if;
    if v_user.hire_date is null then
      reason := 'invalid_date'; return next; continue;
    end if;

    select max(g.granted_on) into v_latest from public.vacation_grants g
    where g.user_id = v_user.id and g.rule_type in ('standard','proportional');
    if exists (
      select 1 from public.vacation_grants g where g.user_id = v_user.id
        and g.rule_type = 'manual' and (v_latest is null or g.granted_on >= v_latest)
    ) or (v_latest is null and coalesce(v_user.num_vacations, 0) > 0) then
      reason := 'reconciliation_required'; return next; continue;
    end if;
    if exists (
      select 1 from public.vacation_grants g where g.user_id = v_user.id
        and g.rule_type not in ('manual','standard','proportional')
    ) or v_latest > p_today then
      reason := 'invalid_history'; return next; continue;
    end if;

    v_index := 0;
    if v_latest is not null then
      while private.vacation_grant_anniversary(v_user.hire_date, v_index) < v_latest loop
        v_index := v_index + 1;
      end loop;
      if private.vacation_grant_anniversary(v_user.hire_date, v_index) <> v_latest then
        reason := 'invalid_history'; return next; continue;
      end if;
      v_index := v_index + 1;
    end if;
    v_date := private.vacation_grant_anniversary(v_user.hire_date, v_index);
    while v_date <= p_today loop
      select * into v_terms from private.vacation_grant_terms(
        v_user.hire_date, v_date, v_user.weekly_days, v_user.weekly_hours
      );
      if not found then reason := 'invalid_schedule'; exit; end if;
      if v_terms.expires_on < p_today then reason := 'historical_gap'; exit; end if;
      grants := grants || jsonb_build_array(jsonb_build_object(
        'user_id', v_user.id, 'granted_on', v_date,
        'service_band', v_terms.service_band, 'days_granted', v_terms.days_granted,
        'days_remaining', v_terms.days_granted, 'expires_on', v_terms.expires_on,
        'rule_type', v_terms.rule_type,
        'notes', format('[auto:supabase:%s] Asignación por aniversario. Asistencia: %s.', p_today,
          case when v_user.attendance_eligible = true then 'elegibilidad confirmada'
          else 'política transitoria; revisión pendiente' end)
      ));
      v_index := v_index + 1;
      v_date := private.vacation_grant_anniversary(v_user.hire_date, v_index);
    end loop;
    if reason is not null then
      grants := '[]'::jsonb;
    elsif jsonb_array_length(grants) = 0 then
      status := 'skipped'; reason := 'up_to_date';
    else status := 'ready';
    end if;
    return next;
  end loop;
end;
$$;

create function private.run_vacation_grants(
  p_dry_run boolean default true, p_reference_at timestamptz default now()
)
returns jsonb
language plpgsql volatile security invoker
set search_path = ''
as $$
declare
  v_today date := (p_reference_at at time zone 'Asia/Tokyo')::date;
  v_started timestamptz := clock_timestamp();
  v_user_id uuid;
  v_plan record;
  v_grant record;
  v_count integer;
  v_issued integer := 0;
  v_would_issue integer := 0;
  v_skipped integer := 0;
  v_blocked integer := 0;
  v_duplicates integer := 0;
  v_reasons jsonb := '{}'::jsonb;
  v_details jsonb := '[]'::jsonb;
  v_summary jsonb;
begin
  if p_dry_run is null or v_today is null then raise exception 'INVALID_ARGUMENT'; end if;
  if not p_dry_run and not pg_try_advisory_xact_lock(1870191, 1) then
    return jsonb_build_object('success',true,'skipped',true,'reason','already_running');
  end if;

  for v_user_id in select u.id from public.users u
    where u.is_active = true and u.is_diplomatic = false order by u.id
  loop
    if not p_dry_run then
      -- Re-read eligibility after locking the profile. Also serialize with
      -- existing grant consumption without rewriting those grants.
      perform 1 from public.users u where u.id = v_user_id for update;
      perform 1 from public.vacation_grants g where g.user_id = v_user_id order by g.id for update;
    end if;
    select * into v_plan from private.plan_vacation_grants(v_today, v_user_id);
    if not found then continue; end if;
    v_details := v_details || jsonb_build_array(jsonb_build_object(
      'user_id',v_user_id,'status',v_plan.status,'reason',v_plan.reason,'grants',v_plan.grants
    ));
    if v_plan.status <> 'ready' then
      if v_plan.status = 'skipped' then v_skipped := v_skipped + 1;
      else v_blocked := v_blocked + 1; end if;
      v_reasons := jsonb_set(v_reasons,array[v_plan.reason],
        to_jsonb(coalesce((v_reasons ->> v_plan.reason)::integer,0) + 1),true);
      continue;
    end if;
    v_would_issue := v_would_issue + jsonb_array_length(v_plan.grants);
    if p_dry_run then continue; end if;

    for v_grant in select * from jsonb_to_recordset(v_plan.grants) as g(
      user_id uuid, granted_on date, service_band text, days_granted numeric,
      days_remaining numeric, expires_on date, rule_type text, notes text
    ) loop
      insert into public.vacation_grants(
        user_id, granted_on, service_band, days_granted, days_remaining, expires_on, rule_type, notes
      ) values (
        v_grant.user_id, v_grant.granted_on, v_grant.service_band, v_grant.days_granted,
        v_grant.days_remaining, v_grant.expires_on, v_grant.rule_type, v_grant.notes
      ) on conflict (user_id,granted_on,service_band)
        where rule_type in ('standard','proportional') do nothing;
      get diagnostics v_count = row_count;
      v_issued := v_issued + v_count;
      v_duplicates := v_duplicates + (1 - v_count);
    end loop;
  end loop;
  v_summary := jsonb_build_object(
    'success',true,'dryRun',p_dry_run,'processedAt',v_today,'issued',v_issued,
    'wouldIssue',v_would_issue,'skipped',v_skipped,'blocked',v_blocked,
    'duplicates',v_duplicates,'failed',0,'reasons',v_reasons
  );
  if not p_dry_run then
    insert into private.vacation_grant_job_runs(started_at,business_date,summary,details)
    values(v_started,v_today,v_summary,v_details);
  end if;
  return v_summary;
exception when others then
  -- Keep native scheduler failures useful without retaining a database error
  -- detail that could include an employee identifier or an entire row.
  raise exception using errcode = 'P0001', message = 'VACATION_GRANT_JOB_FAILED',
    detail = 'La transacción se revirtió; revise la configuración y los permisos.';
end;
$$;

revoke all on function private.vacation_grant_anniversary(date,integer) from public, anon, authenticated, service_role;
revoke all on function private.vacation_grant_terms(date,date,smallint,numeric) from public, anon, authenticated, service_role;
revoke all on function private.plan_vacation_grants(date,uuid) from public, anon, authenticated, service_role;
revoke all on function private.run_vacation_grants(boolean,timestamptz) from public, anon, authenticated, service_role;

comment on function private.run_vacation_grants(boolean,timestamptz) is
  'Internal daily vacation grants. Defaults to dry run; writes and audit are atomic. Errors roll back the entire run and are visible in pg_cron history.';
