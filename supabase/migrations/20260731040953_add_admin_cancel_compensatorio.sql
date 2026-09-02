-- Lets an admin remove a pending compensatorio request from either approval
-- queue ("Aprobar solicitudes de compensatorios" / earn-hours, and
-- "Aprobar descansos por compensatorios" / use-hours) without having to
-- approve it first. Same soft-cancel mechanism as cancel_own_compensatorio
-- (20260731000000_add_cancel_own_request.sql) -- reuses cancelled_at/
-- cancelled_by so cancelled-by-admin and cancelled-by-owner both show up
-- consistently as "Cancelada" in the requester's own statement page, and
-- both already-updated list_unapproved_compensatorys /
-- list_hours_unapproved_compensatorys queues already filter on
-- cancelled_at is null, so no further RPC changes needed there.
--
-- SECURITY DEFINER + internal admin check, same pattern as
-- approve_vacation_with_grants / accumulate_compensatory_hours, rather
-- than a self-service RLS policy.

create or replace function public.admin_cancel_compensatorio(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_approved boolean;
  v_final_approved boolean;
  v_cancelled_at timestamptz;
begin
  if not exists (
    select 1 from public.users
    where users.id = auth.uid()
      and users.admin = 'admin'
      and coalesce(users.is_active, true)
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select approve_request, final_approve_request, cancelled_at
  into v_approved, v_final_approved, v_cancelled_at
  from public.compensatorys
  where id = p_id
  for update;

  if not found then
    raise exception 'COMPENSATORIO_NOT_FOUND';
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

revoke all on function public.admin_cancel_compensatorio(uuid) from public, anon;
grant execute on function public.admin_cancel_compensatorio(uuid) to authenticated;
