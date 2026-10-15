-- Install only the native scheduler. No HTTP request, Vault secret, or Edge
-- Function is required. Keep the job inactive until Vercel is retired.
create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  v_job_id bigint;
begin
  v_job_id := cron.schedule(
    'vacation-grants-daily', '0 1 * * *',
    'select private.run_vacation_grants(false);'
  );
  perform cron.alter_job(v_job_id, active := false);
end;
$$;
