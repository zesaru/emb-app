-- Fixes "Function Search Path Mutable" security advisor warnings on 16
-- legacy functions from 20260323000000_remote_public_schema.sql that were
-- created without an explicit search_path. Without this, a role with
-- CREATE privileges on another schema earlier in the resolution order
-- could shadow an unqualified object reference inside these functions.
-- ALTER FUNCTION ... SET search_path does not change behavior or grants,
-- it only pins name resolution to the public schema.

ALTER FUNCTION public.accumulate_compensatory_hours(bigint, uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_old_login_attempts() SET search_path = public;
ALTER FUNCTION public.compare_first_5_letters() SET search_path = public;
ALTER FUNCTION public.count_failed_attempts(text, integer) SET search_path = public;
ALTER FUNCTION public.count_unapproved_records() SET search_path = public;
ALTER FUNCTION public.get_compensatorys_for_user(uuid) SET search_path = public;
ALTER FUNCTION public.insert_compensatory_rest(uuid, time, time, date, integer) SET search_path = public;
ALTER FUNCTION public.insert_user_in_public_table_for_each_new_user() SET search_path = public;
ALTER FUNCTION public.insertar_vacaciones(date, date, integer, uuid) SET search_path = public;
ALTER FUNCTION public.is_ip_blocked(text) SET search_path = public;
ALTER FUNCTION public.list_hours_unapproved_compensatorys() SET search_path = public;
ALTER FUNCTION public.list_unapproved_compensatorys() SET search_path = public;
ALTER FUNCTION public.list_unapproved_vacations() SET search_path = public;
ALTER FUNCTION public.listar_horas_entrada_salida() SET search_path = public;
ALTER FUNCTION public.listar_vacaciones_compensatorios_no_aprobados_por_usuario() SET search_path = public;
ALTER FUNCTION public.subtract_compensatory_hours(bigint, uuid) SET search_path = public;
