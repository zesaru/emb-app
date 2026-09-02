-- Restores a full backup (users, compensatorys, vacations, attendances) inside
-- one transaction, so a failed insert can never leave a table wiped with no
-- rollback (the previous behavior in lib/backup/backup-service.ts issued
-- separate delete()/insert() calls per table from the client with no
-- transactional guarantee).
--
-- All 4 tables are restored inside a single PL/pgSQL function call (one
-- implicit transaction), in FK-dependency order:
--   1. delete children (vacations, compensatorys, attendances -- all have
--      FKs into users: vacations_id_user_fkey, vacations_approvedby_fkey,
--      compensatorys_user_id_fkey, compensatorys_approved_by_fkey,
--      compensatorys_approved_by_compensated_fkey, attendances_user_id_fkey)
--   2. delete users
--   3. insert users
--   4. insert children
-- Restoring table-by-table via separate RPC calls (an earlier version of
-- this migration) breaks: deleting `users` while a child table still holds
-- rows referencing those ids violates its FK constraint.
--
-- Restricted to service_role: callers must already have gone through the
-- Next.js action layer's requireCurrentUserAdminAndActive() check
-- (actions/restore-backup.ts) before this is invoked via the admin client.

create or replace function public.restore_backup(p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tables_affected text[] := array[]::text[];
begin
  if p_data ? 'vacations' then
    delete from public.vacations;
  end if;

  if p_data ? 'compensatorys' then
    delete from public.compensatorys;
  end if;

  if p_data ? 'attendances' then
    delete from public.attendances;
  end if;

  if p_data ? 'users' then
    delete from public.users;

    if jsonb_array_length(p_data -> 'users') > 0 then
      insert into public.users
      select * from jsonb_populate_recordset(null::public.users, p_data -> 'users');
    end if;

    v_tables_affected := array_append(v_tables_affected, 'users');
  end if;

  if p_data ? 'vacations' then
    if jsonb_array_length(p_data -> 'vacations') > 0 then
      insert into public.vacations
      select * from jsonb_populate_recordset(null::public.vacations, p_data -> 'vacations');
    end if;
    v_tables_affected := array_append(v_tables_affected, 'vacations');
  end if;

  if p_data ? 'compensatorys' then
    if jsonb_array_length(p_data -> 'compensatorys') > 0 then
      insert into public.compensatorys
      select * from jsonb_populate_recordset(null::public.compensatorys, p_data -> 'compensatorys');
    end if;
    v_tables_affected := array_append(v_tables_affected, 'compensatorys');
  end if;

  if p_data ? 'attendances' then
    if jsonb_array_length(p_data -> 'attendances') > 0 then
      insert into public.attendances
      select * from jsonb_populate_recordset(null::public.attendances, p_data -> 'attendances');
    end if;
    v_tables_affected := array_append(v_tables_affected, 'attendances');
  end if;

  return jsonb_build_object('tables_affected', to_jsonb(v_tables_affected));
end;
$$;

revoke all on function public.restore_backup(jsonb) from public, authenticated, anon;
grant execute on function public.restore_backup(jsonb) to service_role;
