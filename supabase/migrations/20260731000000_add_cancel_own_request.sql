-- Lets a user cancel their own still-pending vacation or compensatorio
-- request (e.g. filed by mistake). No DELETE RLS policy exists on either
-- table today (confirmed: only INSERT/UPDATE policies were added in
-- 20260707120000_fix_rls_privilege_escalation.sql), so this is a green
-- field -- there is nothing to "close" here, just something to add safely.
--
-- Deliberately NOT implemented as a self-service UPDATE/DELETE RLS policy:
-- that would let a user rewrite/erase any column on their own row via the
-- raw REST API, not just cancel it -- reopening exactly the kind of
-- unrestricted write path this session's earlier migrations closed. Instead
-- this follows the existing pattern (approve_vacation_with_grants,
-- accumulate_compensatory_hours): a SECURITY DEFINER function that
-- validates everything server-side and is the only way to mutate these
-- columns.
--
-- Soft-cancel (cancelled_at/cancelled_by), not a real DELETE: keeps the
-- audit trail, consistent with how approvals are already tracked via
-- approved_by/approved_date instead of being destructive.

alter table public.vacations
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.users(id);

alter table public.compensatorys
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.users(id);

create or replace function public.cancel_own_vacation(p_vacation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_approved boolean;
  v_cancelled_at timestamptz;
begin
  select id_user, approve_request, cancelled_at
  into v_owner, v_approved, v_cancelled_at
  from public.vacations
  where id = p_vacation_id
  for update;

  if v_owner is null then
    raise exception 'VACATION_NOT_FOUND';
  end if;

  if v_owner <> auth.uid() then
    raise exception 'NOT_OWNER';
  end if;

  if v_cancelled_at is not null then
    raise exception 'ALREADY_CANCELLED';
  end if;

  if v_approved is true then
    raise exception 'ALREADY_APPROVED';
  end if;

  update public.vacations
  set cancelled_at = now(),
      cancelled_by = auth.uid()
  where id = p_vacation_id;
end;
$$;

create or replace function public.cancel_own_compensatorio(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_approved boolean;
  v_final_approved boolean;
  v_cancelled_at timestamptz;
begin
  select user_id, approve_request, final_approve_request, cancelled_at
  into v_owner, v_approved, v_final_approved, v_cancelled_at
  from public.compensatorys
  where id = p_id
  for update;

  if v_owner is null then
    raise exception 'COMPENSATORIO_NOT_FOUND';
  end if;

  if v_owner <> auth.uid() then
    raise exception 'NOT_OWNER';
  end if;

  if v_cancelled_at is not null then
    raise exception 'ALREADY_CANCELLED';
  end if;

  if v_approved is true or v_final_approved is true then
    raise exception 'ALREADY_APPROVED';
  end if;

  update public.compensatorys
  set cancelled_at = now(),
      cancelled_by = auth.uid()
  where id = p_id;
end;
$$;

revoke all on function public.cancel_own_vacation(uuid) from public, anon;
grant execute on function public.cancel_own_vacation(uuid) to authenticated;

revoke all on function public.cancel_own_compensatorio(uuid) from public, anon;
grant execute on function public.cancel_own_compensatorio(uuid) to authenticated;

-- Exclude cancelled requests from the admin approval queues, otherwise a
-- cancelled request would still show up waiting for an admin to approve it.

create or replace function public.list_unapproved_vacations() returns table("id" uuid, "created_at" timestamp with time zone, "start" date, "request_date" date, "days" integer, "finish" date, "approve_request" boolean, "user_id" uuid, "user_name" text, "num_vacations" bigint, "email" text)
    language plpgsql
    set search_path = public
    as $$
begin
    return query
    select v.id, v.created_at, v.start, v.request_date, v.days, v.finish, v.approve_request,
           u.id as user_id, u.name as user_name, u.num_vacations, u.email
    from vacations v
    inner join users u on v.id_user = u.id
    where (v.approved_date is null and v.approve_request is false and v.cancelled_at is null);
end;
$$;

create or replace function public.list_unapproved_compensatorys() returns table("id" uuid, "created_at" timestamp with time zone, "user_id" uuid, "event_date" date, "event_name" text, "hours" integer, "approve_request" boolean, "approved_by" uuid, "approved_date" date, "compensated_hours" integer, "approved_by_compensated" uuid, "compensated_hours_day" date, "final_approve_request" boolean, "t_time_start" time without time zone, "t_time_finish" time without time zone, "user_name" text, "num_compensatorys" bigint, "email" text)
    language plpgsql
    set search_path = public
    as $$
begin
    return query
    select c.*, u.name as user_name, u.num_compensatorys, u.email
    from compensatorys c
    left join users u on c.user_id = u.id
    where (c.event_name is not null and c.approve_request is null and c.cancelled_at is null);
end;
$$;

create or replace function public.list_hours_unapproved_compensatorys() returns table("id" uuid, "created_at" timestamp with time zone, "user_id" uuid, "event_date" date, "event_name" text, "hours" integer, "approve_request" boolean, "approved_by" uuid, "approved_date" date, "compensated_hours" integer, "approved_by_compensated" uuid, "compensated_hours_day" date, "final_approve_request" boolean, "t_time_start" time without time zone, "t_time_finish" time without time zone, "user_name" text, "num_compensatorys" bigint, "email" text)
    language plpgsql
    set search_path = public
    as $$
begin
    return query
    select c.*, u.name as user_name, u.num_compensatorys, u.email
    from compensatorys c
    left join users u on c.user_id = u.id
    where (c.final_approve_request is null and c.event_name is null and c.cancelled_at is null);
end;
$$;
