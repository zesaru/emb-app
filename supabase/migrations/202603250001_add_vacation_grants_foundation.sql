alter table public.users
add column if not exists weekly_days smallint,
add column if not exists weekly_hours numeric(4,1),
add column if not exists attendance_eligible boolean;

comment on column public.users.weekly_days is 'Dias laborales programados por semana para determinar la regla de vacaciones';
comment on column public.users.weekly_hours is 'Horas laborales programadas por semana para determinar la regla de vacaciones';
comment on column public.users.attendance_eligible is 'Elegibilidad manual para la regla del 80% de asistencia. Null significa pendiente de revision';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_weekly_days_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
    add constraint users_weekly_days_check
    check (weekly_days is null or weekly_days between 1 and 7);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_weekly_hours_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
    add constraint users_weekly_hours_check
    check (weekly_hours is null or (weekly_hours >= 0 and weekly_hours <= 168));
  end if;
end $$;

create table if not exists public.vacation_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  granted_on date not null,
  service_band text not null,
  days_granted numeric(5,2) not null,
  days_remaining numeric(5,2) not null,
  expires_on date not null,
  rule_type text not null,
  notes text,
  created_at timestamp with time zone not null default now(),
  constraint vacation_grants_service_band_check check (
    service_band in (
      '6_months',
      '1_year_6_months',
      '2_years_6_months',
      '3_years_6_months',
      '4_years_6_months',
      '5_years_6_months',
      '6_years_6_months_plus'
    )
  ),
  constraint vacation_grants_rule_type_check check (
    rule_type in ('standard', 'proportional', 'manual')
  ),
  constraint vacation_grants_days_granted_check check (days_granted >= 0),
  constraint vacation_grants_days_remaining_check check (
    days_remaining >= 0 and days_remaining <= days_granted
  ),
  constraint vacation_grants_expiration_check check (expires_on >= granted_on)
);

comment on table public.vacation_grants is 'Eventos de otorgamiento de vacaciones para el nuevo motor basado en grants';
comment on column public.vacation_grants.user_id is 'Usuario al que se le otorga el bloque de vacaciones';
comment on column public.vacation_grants.granted_on is 'Fecha en la que se otorga la bolsa de vacaciones';
comment on column public.vacation_grants.service_band is 'Tramo de antiguedad legal usado para calcular el otorgamiento';
comment on column public.vacation_grants.days_granted is 'Dias otorgados en este grant';
comment on column public.vacation_grants.days_remaining is 'Dias restantes disponibles dentro de este grant';
comment on column public.vacation_grants.expires_on is 'Fecha de expiracion del grant, normalmente granted_on + 2 anos';
comment on column public.vacation_grants.rule_type is 'Regla aplicada en el grant: standard, proportional o manual';
comment on column public.vacation_grants.notes is 'Notas administrativas o justificacion manual del grant';

create index if not exists vacation_grants_user_id_granted_on_idx
on public.vacation_grants (user_id, granted_on desc);

create index if not exists vacation_grants_user_id_expires_on_idx
on public.vacation_grants (user_id, expires_on);
