

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."accumulate_compensatory_hours"("hours" bigint, "user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Actualiza el campo num_compensatorys para el usuario específico
  UPDATE users
  SET num_compensatorys = num_compensatorys + hours
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."accumulate_compensatory_hours"("hours" bigint, "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_login_attempts"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Eliminar intentos de login de más de 7 días
    DELETE FROM login_attempts 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Eliminar sesiones de dispositivos expiradas
    DELETE FROM device_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
    
    -- Eliminar eventos de seguridad de más de 30 días (excepto críticos)
    DELETE FROM security_events 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    AND severity != 'critical';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_login_attempts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compare_first_5_letters"() RETURNS TABLE("user_name" character varying, "attendance_name" character varying, "comparison_result" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.name AS user_name,
        a.name AS attendance_name,
        LEFT(u.name, 5) = LEFT(a.name, 5) AS comparison_result
    FROM
        users u
    JOIN
        attendances a ON u.id = a.user_id;
END;
$$;


ALTER FUNCTION "public"."compare_first_5_letters"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_failed_attempts"("p_identifier" "text", "p_window_minutes" integer DEFAULT 15) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO attempt_count
    FROM login_attempts
    WHERE identifier = p_identifier
    AND success = FALSE
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    RETURN COALESCE(attempt_count, 0);
END;
$$;


ALTER FUNCTION "public"."count_failed_attempts"("p_identifier" "text", "p_window_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_unapproved_records"() RETURNS TABLE("unapproved_count" integer, "final_approve_request_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Contar registros no aprobados en approve_request
    SELECT COUNT(*) INTO unapproved_count
    FROM compensatorys
    WHERE approve_request = FALSE or approve_request is null;

    -- Contar registros en final_approve_request
    SELECT COUNT(*) INTO final_approve_request_count
    FROM compensatorys
    WHERE final_approve_request = FALSE OR final_approve_request IS NULL;

    -- Devolver los resultados
    RETURN QUERY SELECT unapproved_count, final_approve_request_count;
END;
$$;


ALTER FUNCTION "public"."count_unapproved_records"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_compensatorys_for_user"("user_id" "uuid") RETURNS TABLE("compensatory_id" "uuid", "user_name" "text", "event_date" "date", "event_name" "text", "hours" integer, "approve_request" boolean, "approved_by" "uuid", "approved_date" "date", "compensated_hours" integer, "approved_by_compensated" "uuid", "compensated_hours_day" "date", "final_approve_request" boolean, "t_time_start" time without time zone, "t_time_finish" time without time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS compensatory_id,
        u.name AS user_name,
        COALESCE(c.event_date, c.compensated_hours_day) AS event_date,
        COALESCE(c.event_name, 'Solicitud de descanso') AS event_name,
        c.hours,
        c.approve_request,
        c.approved_by,
        c.approved_date,
        c.compensated_hours,
        c.approved_by_compensated,
        c.compensated_hours_day,
        c.final_approve_request,
        c.t_time_start,
        c.t_time_finish
    FROM compensatorys c
    JOIN users u ON c.user_id = u.id
    WHERE c.user_id = get_compensatorys_for_user.user_id
    ORDER BY COALESCE(c.event_date, c.compensated_hours_day);
END;
$$;


ALTER FUNCTION "public"."get_compensatorys_for_user"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_compensatory_rest"("p_user_id" "uuid", "p_t_time_start" time without time zone, "p_t_time_finish" time without time zone, "p_compensated_hours_day" "date", "p_compensated_hours" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO compensatorys(
        user_id, t_time_start, t_time_finish, compensated_hours_day, compensated_hours
    )
    VALUES(
        p_user_id, p_t_time_start, p_t_time_finish, p_compensated_hours_day, p_compensated_hours
    );
END;
$$;


ALTER FUNCTION "public"."insert_compensatory_rest"("p_user_id" "uuid", "p_t_time_start" time without time zone, "p_t_time_finish" time without time zone, "p_compensated_hours_day" "date", "p_compensated_hours" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_user_in_public_table_for_each_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$begin
  insert into public.users (id , email)
  values (
    new.id,
    new.email
  );
  return new;
end$$;


ALTER FUNCTION "public"."insert_user_in_public_table_for_each_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insertar_vacaciones"("p_start" "date", "p_finish" "date", "p_days" integer, "p_id_user" "uuid") RETURNS TABLE("users_id" "uuid", "users_created_at" timestamp with time zone, "users_name" "text", "users_email" "text", "users_role" "text", "users_num_vacations" bigint, "users_num_compensatorys" bigint, "users_admin" character varying, "vacations_id" "uuid", "vacations_created_at" timestamp with time zone, "vacations_id_user" "uuid", "vacations_request_date" "date", "vacations_period" bigint, "vacations_start" "date", "vacations_finish" "date", "vacations_days" integer, "vacations_approved_date" "date", "vacations_approvedby" "uuid", "vacations_approve_request" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insertar en la tabla "vacations"
    INSERT INTO vacations (id_user, request_date, period, start, finish, days, approve_request)
    VALUES (p_id_user, CURRENT_DATE, p_days, p_start, p_finish, p_days, FALSE)
    RETURNING * INTO vacations_id, vacations_created_at, vacations_id_user, vacations_request_date, vacations_period, vacations_start, vacations_finish, vacations_days, vacations_approved_date, vacations_approvedby, vacations_approve_request;

    -- Realizar un join con la tabla "users"
    SELECT
        u.id AS users_id,
        u.created_at AS users_created_at,
        u.name AS users_name,
        u.email AS users_email,
        u.role AS users_role,
        u.num_vacations AS users_num_vacations,
        u.num_compensatorys AS users_num_compensatorys,
        u.admin AS users_admin,
        v.*
    INTO
        users_id, users_created_at, users_name, users_email, users_role, users_num_vacations, users_num_compensatorys, users_admin
    FROM users u
    JOIN vacations v ON u.id = v.id_user
    WHERE u.id = p_id_user
    AND v.id = vacations_id;

    RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."insertar_vacaciones"("p_start" "date", "p_finish" "date", "p_days" integer, "p_id_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_ip_blocked"("p_identifier" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    blocked_until_time TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT blocked_until INTO blocked_until_time
    FROM login_attempts
    WHERE identifier = p_identifier
    AND blocked_until > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN blocked_until_time IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."is_ip_blocked"("p_identifier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_hours_unapproved_compensatorys"() RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "user_id" "uuid", "event_date" "date", "event_name" "text", "hours" integer, "approve_request" boolean, "approved_by" "uuid", "approved_date" "date", "compensated_hours" integer, "approved_by_compensated" "uuid", "compensated_hours_day" "date", "final_approve_request" boolean, "t_time_start" time without time zone, "t_time_finish" time without time zone, "user_name" "text", "num_compensatorys" bigint, "email" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT c.*, u.name AS user_name, u.num_compensatorys, u.email
    FROM compensatorys c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE (c.final_approve_request IS NULL AND c.event_name IS NULL);
END;
$$;


ALTER FUNCTION "public"."list_hours_unapproved_compensatorys"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_unapproved_compensatorys"() RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "user_id" "uuid", "event_date" "date", "event_name" "text", "hours" integer, "approve_request" boolean, "approved_by" "uuid", "approved_date" "date", "compensated_hours" integer, "approved_by_compensated" "uuid", "compensated_hours_day" "date", "final_approve_request" boolean, "t_time_start" time without time zone, "t_time_finish" time without time zone, "user_name" "text", "num_compensatorys" bigint, "email" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT c.*, u.name AS user_name, u.num_compensatorys, u.email
    FROM compensatorys c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE (c.event_name IS NOT NULL AND c.approve_request IS NULL);
END;
$$;


ALTER FUNCTION "public"."list_unapproved_compensatorys"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_unapproved_vacations"() RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "start" "date", "request_date" "date", "days" integer, "finish" "date", "approve_request" boolean, "user_id" "uuid", "user_name" "text", "num_vacations" bigint, "email" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT v.id, v.created_at, v.start, v.request_date, v.days, v.finish, v.approve_request,
           u.id AS user_id, u.name AS user_name, u.num_vacations, u.email
    FROM vacations v
    INNER JOIN users u ON v.id_user = u.id
    WHERE (v.approved_date IS NULL and v.approve_request is false) ;
END;
$$;


ALTER FUNCTION "public"."list_unapproved_vacations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."listar_horas_entrada_salida"() RETURNS TABLE("id" "uuid", "name" "text", "fecha" "date", "hora_entrada" time without time zone, "hora_salida" time without time zone, "t_time_start" time without time zone, "t_time_finish" time without time zone, "compensated_hours_day" "date")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
    -- Filas de attendances
    SELECT
      a.user_id AS id,
      u.name,
      date(a.date) AS fecha,
      MAX(CASE WHEN a.register = 0 THEN a.date::time END) AS hora_entrada,
      MAX(CASE WHEN a.register = 1 THEN a.date::time END) AS hora_salida,
      c.t_time_start,
      c.t_time_finish,
      c.compensated_hours_day
    FROM attendances a
    INNER JOIN users u ON a.user_id = u.id
    LEFT JOIN compensatorys c ON a.user_id = c.user_id AND date(a.date) = c.compensated_hours_day
    WHERE (a.register = 0 OR a.register = 1 OR c.compensated_hours > 1)
    GROUP BY a.user_id, u.name, fecha, c.t_time_start, c.t_time_finish, c.compensated_hours_day
    HAVING COUNT(DISTINCT a.register) >= 1

    UNION

    -- Filas de compensatorys sin correspondencia en attendances
    SELECT
      c.user_id AS id,
      u.name,
      c.compensated_hours_day AS fecha,
      NULL AS hora_entrada,
      NULL AS hora_salida,
      c.t_time_start,
      c.t_time_finish,
      c.compensated_hours_day
    FROM compensatorys c
    INNER JOIN users u ON c.user_id = u.id
    LEFT JOIN attendances a ON a.user_id = c.user_id AND date(a.date) = c.compensated_hours_day
    WHERE a.user_id IS NULL
    ORDER BY name, fecha;

END;
$$;


ALTER FUNCTION "public"."listar_horas_entrada_salida"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."listar_vacaciones_compensatorios_no_aprobados_por_usuario"() RETURNS TABLE("user_name" "text", "user_email" "text", "cantidad_registros_no_aprobados" bigint, "cantidad_horas_compensatorios_no_aprobados" bigint, "cantidad_vacaciones_no_aprobadas" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.name as user_name,
    u.email as user_email,
    count(
      DISTINCT CASE
        WHEN (
          c.event_name IS NOT NULL
          AND c.approve_request IS NULL
        ) THEN c.id
      END
    ) AS cantidad_registros_no_aprobados,
    count(
      DISTINCT CASE
        WHEN (
          c.final_approve_request IS NULL
          AND c.event_name IS NULL
        ) THEN c.id
      END
    ) AS cantidad_horas_compensatorios_no_aprobados,
    count(
      DISTINCT CASE
        WHEN v.approve_request = false THEN v.id
      END
    ) AS cantidad_vacaciones_no_aprobadas
  FROM
    users u
    LEFT JOIN vacations v ON u.id = v.id_user
    LEFT JOIN compensatorys c ON u.id = c.user_id
  WHERE
    u.admin = 'user'
  GROUP BY
    u.name,
    u.email
  HAVING
    count(
      DISTINCT CASE
        WHEN (
          c.event_name IS NOT NULL
          AND c.approve_request IS NULL
        ) THEN c.id
      END
    ) + 
    count(
      DISTINCT CASE
        WHEN (
          c.final_approve_request IS NULL
          AND c.event_name IS NULL
        ) THEN c.id
      END
    ) +
    count(
      DISTINCT CASE
        WHEN v.approve_request = false THEN v.id
      END
    ) > 0; -- Excluye usuarios con todas las cantidades igual a 0

END;
$$;


ALTER FUNCTION "public"."listar_vacaciones_compensatorios_no_aprobados_por_usuario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."subtract_compensatory_hours"("hours" bigint, "user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update users
  set num_compensatorys = num_compensatorys - hours
  where id = user_id;
end;
$$;


ALTER FUNCTION "public"."subtract_compensatory_hours"("hours" bigint, "user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."attendances" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "name" character varying,
    "date" timestamp without time zone,
    "ai" smallint,
    "register" smallint
);


ALTER TABLE "public"."attendances" OWNER TO "postgres";


COMMENT ON TABLE "public"."attendances" IS 'asistencia';



ALTER TABLE "public"."attendances" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."attendances_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."compensatorys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "event_date" "date",
    "event_name" "text",
    "hours" integer,
    "approve_request" boolean,
    "approved_by" "uuid",
    "approved_date" "date",
    "compensated_hours" integer,
    "approved_by_compensated" "uuid",
    "compensated_hours_day" "date",
    "final_approve_request" boolean,
    "t_time_start" time without time zone,
    "t_time_finish" time without time zone
);


ALTER TABLE "public"."compensatorys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_fingerprint" "text" NOT NULL,
    "device_name" "text",
    "ip_address" "text",
    "user_agent" "text",
    "remember_token" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "last_used_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."device_sessions" IS 'Gestiona sesiones de dispositivos para "Remember Me"';



COMMENT ON COLUMN "public"."device_sessions"."device_fingerprint" IS 'Huella digital del dispositivo para identificación';



COMMENT ON COLUMN "public"."device_sessions"."remember_token" IS 'Token seguro para mantener sesión activa';



CREATE TABLE IF NOT EXISTS "public"."login_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identifier" "text" NOT NULL,
    "email" "text",
    "ip_address" "text",
    "user_agent" "text",
    "success" boolean DEFAULT false NOT NULL,
    "blocked_until" timestamp with time zone,
    "attempt_type" "text" DEFAULT 'login'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "login_attempts_attempt_type_check" CHECK (("attempt_type" = ANY (ARRAY['login'::"text", 'password_reset'::"text", 'signup'::"text"])))
);


ALTER TABLE "public"."login_attempts" OWNER TO "postgres";


COMMENT ON TABLE "public"."login_attempts" IS 'Rastrea intentos de login para rate limiting y seguridad';



COMMENT ON COLUMN "public"."login_attempts"."identifier" IS 'Hash de IP + User Agent para identificar dispositivos únicos';



COMMENT ON COLUMN "public"."login_attempts"."blocked_until" IS 'Timestamp hasta cuando el identificador está bloqueado';



CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text",
    "ip_address" "text",
    "user_agent" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "security_events_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."security_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."security_events" IS 'Log de eventos de seguridad del sistema';



COMMENT ON COLUMN "public"."security_events"."metadata" IS 'Información adicional del evento en formato JSON';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "email" "text" NOT NULL,
    "role" "text",
    "num_vacations" bigint,
    "num_compensatorys" bigint,
    "admin" character varying,
    "is_active" boolean,
    "hire_date" "date",
    "is_diplomatic" boolean DEFAULT false NOT NULL,
    "position" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."hire_date" IS 'Fecha de ingreso del colaborador';



COMMENT ON COLUMN "public"."users"."is_diplomatic" IS 'Indica si el usuario es diplomatico';



COMMENT ON COLUMN "public"."users"."position" IS 'Cargo del usuario';



CREATE TABLE IF NOT EXISTS "public"."vacations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_user" "uuid",
    "request_date" "date",
    "period" bigint,
    "start" "date",
    "finish" "date",
    "days" integer,
    "approved_date" "date",
    "approvedby" "uuid",
    "approve_request" boolean
);


ALTER TABLE "public"."vacations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compensatorys"
    ADD CONSTRAINT "compensatorys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_sessions"
    ADD CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_sessions"
    ADD CONSTRAINT "device_sessions_remember_token_key" UNIQUE ("remember_token");



ALTER TABLE ONLY "public"."login_attempts"
    ADD CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vacations"
    ADD CONSTRAINT "vacations_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_device_sessions_active" ON "public"."device_sessions" USING "btree" ("is_active", "expires_at");



CREATE INDEX "idx_device_sessions_expires_at" ON "public"."device_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_device_sessions_fingerprint" ON "public"."device_sessions" USING "btree" ("device_fingerprint");



CREATE INDEX "idx_device_sessions_remember_token" ON "public"."device_sessions" USING "btree" ("remember_token");



CREATE INDEX "idx_device_sessions_user_id" ON "public"."device_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_login_attempts_blocked_until" ON "public"."login_attempts" USING "btree" ("blocked_until");



CREATE INDEX "idx_login_attempts_composite" ON "public"."login_attempts" USING "btree" ("identifier", "created_at", "success");



CREATE INDEX "idx_login_attempts_created_at" ON "public"."login_attempts" USING "btree" ("created_at");



CREATE INDEX "idx_login_attempts_email" ON "public"."login_attempts" USING "btree" ("email");



CREATE INDEX "idx_login_attempts_identifier" ON "public"."login_attempts" USING "btree" ("identifier");



CREATE INDEX "idx_login_attempts_success" ON "public"."login_attempts" USING "btree" ("success");



CREATE INDEX "idx_security_events_created_at" ON "public"."security_events" USING "btree" ("created_at");



CREATE INDEX "idx_security_events_severity" ON "public"."security_events" USING "btree" ("severity");



CREATE INDEX "idx_security_events_type" ON "public"."security_events" USING "btree" ("event_type");



CREATE INDEX "idx_security_events_user_id" ON "public"."security_events" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."compensatorys"
    ADD CONSTRAINT "compensatorys_approved_by_compensated_fkey" FOREIGN KEY ("approved_by_compensated") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."compensatorys"
    ADD CONSTRAINT "compensatorys_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."compensatorys"
    ADD CONSTRAINT "compensatorys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."device_sessions"
    ADD CONSTRAINT "device_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."vacations"
    ADD CONSTRAINT "vacations_approvedby_fkey" FOREIGN KEY ("approvedby") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vacations"
    ADD CONSTRAINT "vacations_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id");



CREATE POLICY "Enable insert" ON "public"."compensatorys" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read  for auth users" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all auth users" ON "public"."attendances" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for auth_users" ON "public"."vacations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authusers" ON "public"."vacations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read for auth users" ON "public"."compensatorys" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update " ON "public"."compensatorys" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update access " ON "public"."users" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable update access for authuser" ON "public"."vacations" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage device sessions" ON "public"."device_sessions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage login attempts" ON "public"."login_attempts" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage security events" ON "public"."security_events" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can view their own device sessions" ON "public"."device_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own security events" ON "public"."security_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."attendances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compensatorys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."device_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vacations" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."accumulate_compensatory_hours"("hours" bigint, "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accumulate_compensatory_hours"("hours" bigint, "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accumulate_compensatory_hours"("hours" bigint, "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_login_attempts"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_login_attempts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_login_attempts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."compare_first_5_letters"() TO "anon";
GRANT ALL ON FUNCTION "public"."compare_first_5_letters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."compare_first_5_letters"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_failed_attempts"("p_identifier" "text", "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."count_failed_attempts"("p_identifier" "text", "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_failed_attempts"("p_identifier" "text", "p_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."count_unapproved_records"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_unapproved_records"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_unapproved_records"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_compensatorys_for_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_compensatorys_for_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_compensatorys_for_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_compensatory_rest"("p_user_id" "uuid", "p_t_time_start" time without time zone, "p_t_time_finish" time without time zone, "p_compensated_hours_day" "date", "p_compensated_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_compensatory_rest"("p_user_id" "uuid", "p_t_time_start" time without time zone, "p_t_time_finish" time without time zone, "p_compensated_hours_day" "date", "p_compensated_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_compensatory_rest"("p_user_id" "uuid", "p_t_time_start" time without time zone, "p_t_time_finish" time without time zone, "p_compensated_hours_day" "date", "p_compensated_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_user_in_public_table_for_each_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_user_in_public_table_for_each_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_user_in_public_table_for_each_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insertar_vacaciones"("p_start" "date", "p_finish" "date", "p_days" integer, "p_id_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."insertar_vacaciones"("p_start" "date", "p_finish" "date", "p_days" integer, "p_id_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insertar_vacaciones"("p_start" "date", "p_finish" "date", "p_days" integer, "p_id_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_ip_blocked"("p_identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_ip_blocked"("p_identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_ip_blocked"("p_identifier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_hours_unapproved_compensatorys"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_hours_unapproved_compensatorys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_hours_unapproved_compensatorys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."list_unapproved_compensatorys"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_unapproved_compensatorys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_unapproved_compensatorys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."list_unapproved_vacations"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_unapproved_vacations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_unapproved_vacations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."listar_horas_entrada_salida"() TO "anon";
GRANT ALL ON FUNCTION "public"."listar_horas_entrada_salida"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."listar_horas_entrada_salida"() TO "service_role";



GRANT ALL ON FUNCTION "public"."listar_vacaciones_compensatorios_no_aprobados_por_usuario"() TO "anon";
GRANT ALL ON FUNCTION "public"."listar_vacaciones_compensatorios_no_aprobados_por_usuario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."listar_vacaciones_compensatorios_no_aprobados_por_usuario"() TO "service_role";



GRANT ALL ON FUNCTION "public"."subtract_compensatory_hours"("hours" bigint, "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."subtract_compensatory_hours"("hours" bigint, "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."subtract_compensatory_hours"("hours" bigint, "user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."attendances" TO "anon";
GRANT ALL ON TABLE "public"."attendances" TO "authenticated";
GRANT ALL ON TABLE "public"."attendances" TO "service_role";



GRANT ALL ON SEQUENCE "public"."attendances_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."attendances_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."attendances_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."compensatorys" TO "anon";
GRANT ALL ON TABLE "public"."compensatorys" TO "authenticated";
GRANT ALL ON TABLE "public"."compensatorys" TO "service_role";



GRANT ALL ON TABLE "public"."device_sessions" TO "anon";
GRANT ALL ON TABLE "public"."device_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."device_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."login_attempts" TO "anon";
GRANT ALL ON TABLE "public"."login_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."login_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vacations" TO "anon";
GRANT ALL ON TABLE "public"."vacations" TO "authenticated";
GRANT ALL ON TABLE "public"."vacations" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






