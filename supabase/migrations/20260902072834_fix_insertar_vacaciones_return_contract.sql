-- The legacy function used RETURNING * and v.* while its declared return
-- contract listed only the original vacation columns. Newer columns caused
-- PL/pgSQL lint warnings and made the result dependent on table shape.

create or replace function public.insertar_vacaciones(
  p_start date,
  p_finish date,
  p_days integer,
  p_id_user uuid
)
returns table (
  users_id uuid,
  users_created_at timestamptz,
  users_name text,
  users_email text,
  users_role text,
  users_num_vacations bigint,
  users_num_compensatorys bigint,
  users_admin varchar,
  vacations_id uuid,
  vacations_created_at timestamptz,
  vacations_id_user uuid,
  vacations_request_date date,
  vacations_period bigint,
  vacations_start date,
  vacations_finish date,
  vacations_days integer,
  vacations_approved_date date,
  vacations_approvedby uuid,
  vacations_approve_request boolean
)
language plpgsql
set search_path = public
as $$
begin
  return query
  with inserted as (
    insert into public.vacations (
      id_user,
      request_date,
      period,
      start,
      finish,
      days,
      approve_request
    ) values (
      p_id_user,
      current_date,
      p_days,
      p_start,
      p_finish,
      p_days,
      false
    )
    returning id, created_at, id_user, request_date, period, start, finish, days, approved_date, approvedby, approve_request
  )
  select
    u.id,
    u.created_at,
    u.name,
    u.email,
    u.role,
    u.num_vacations,
    u.num_compensatorys,
    u.admin,
    i.id,
    i.created_at,
    i.id_user,
    i.request_date,
    i.period,
    i.start,
    i.finish,
    i.days,
    i.approved_date,
    i.approvedby,
    i.approve_request
  from inserted i
  join public.users u on u.id = i.id_user;
end;
$$;
