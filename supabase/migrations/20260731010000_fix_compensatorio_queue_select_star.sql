-- Fixes a production outage introduced by 20260731000000_add_cancel_own_request.sql:
-- that migration added cancelled_at/cancelled_by columns to public.compensatorys,
-- which shifted `select c.*` in list_unapproved_compensatorys and
-- list_hours_unapproved_compensatorys out of alignment with their declared
-- RETURNS TABLE(...) signature (which was never updated to include the new
-- columns). Every call failed with:
--   ERROR: structure of query does not match function result type
--   DETAIL: Returned type timestamp with time zone does not match expected type text
-- The admin approval queue actions (actions/getCompensatoriosNoApproved.ts,
-- actions/getVacationsNoApproved.ts) swallow the RPC error and just return
-- [], so both compensatorio approval tables silently rendered empty while
-- the unrelated "pending count" widgets (backed by a different RPC) kept
-- showing a non-zero count.
--
-- Fix: select explicit columns instead of c.*, so future ALTER TABLEs on
-- compensatorys can no longer silently break this by changing column order.

create or replace function public.list_unapproved_compensatorys() returns table("id" uuid, "created_at" timestamp with time zone, "user_id" uuid, "event_date" date, "event_name" text, "hours" integer, "approve_request" boolean, "approved_by" uuid, "approved_date" date, "compensated_hours" integer, "approved_by_compensated" uuid, "compensated_hours_day" date, "final_approve_request" boolean, "t_time_start" time without time zone, "t_time_finish" time without time zone, "user_name" text, "num_compensatorys" bigint, "email" text)
    language plpgsql
    set search_path = public
    as $$
begin
    return query
    select c.id, c.created_at, c.user_id, c.event_date, c.event_name, c.hours,
           c.approve_request, c.approved_by, c.approved_date, c.compensated_hours,
           c.approved_by_compensated, c.compensated_hours_day, c.final_approve_request,
           c.t_time_start, c.t_time_finish,
           u.name as user_name, u.num_compensatorys, u.email
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
    select c.id, c.created_at, c.user_id, c.event_date, c.event_name, c.hours,
           c.approve_request, c.approved_by, c.approved_date, c.compensated_hours,
           c.approved_by_compensated, c.compensated_hours_day, c.final_approve_request,
           c.t_time_start, c.t_time_finish,
           u.name as user_name, u.num_compensatorys, u.email
    from compensatorys c
    left join users u on c.user_id = u.id
    where (c.final_approve_request is null and c.event_name is null and c.cancelled_at is null);
end;
$$;
