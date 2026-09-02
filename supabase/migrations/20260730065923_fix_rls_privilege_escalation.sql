-- Fixes RLS policies that were effectively USING (true) / WITH CHECK (true)
-- on WRITE paths, allowing any authenticated user to bypass server-side admin
-- checks by calling the Supabase REST/RPC API directly: self-grant admin,
-- self-approve vacations/compensatory time, or insert records under another
-- employee's identity.
--
-- SELECT policies on users/vacations/compensatorys are intentionally left
-- open to `authenticated` (unchanged from the baseline migration): the
-- "/calendar" page (app/(dashboard)/(routes)/calendar/page.tsx) is a
-- legitimate team-wide feature that shows every employee's vacation and
-- compensatory-time schedule, and depends on being able to read other
-- users' names/dates via `user1:users!...(*)` joins. Restricting SELECT
-- here would break that feature. Application-level filtering for the
-- non-calendar list/detail pages (which show more sensitive fields) is
-- handled separately in app/(dashboard)/(routes)/{compensatorios,vacaciones}.

-- ============================================================
-- users
-- ============================================================

drop policy if exists "Enable update access " on public.users;

-- Only active admins can write to users (role, balances, is_active, etc.).
-- No self-service update path exists in the app (actions/admin/users/update-user.ts
-- is the only writer and is already gated by requireAdminContext()).
create policy "Only active admins can update users"
on public.users
for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.admin = 'admin'
      and coalesce(u.is_active, true)
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.admin = 'admin'
      and coalesce(u.is_active, true)
  )
);

-- ============================================================
-- vacations
-- ============================================================

drop policy if exists "Enable update access for authuser" on public.vacations;
drop policy if exists "Enable read access for authusers" on public.vacations;

create policy "Users can insert own vacations"
on public.vacations
for insert
to authenticated
with check (auth.uid() = id_user);

-- Approval is only ever done through approve_vacation_with_grants (SECURITY DEFINER),
-- so direct table UPDATEs are restricted to active admins only.
create policy "Only active admins can update vacations"
on public.vacations
for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.admin = 'admin'
      and coalesce(u.is_active, true)
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.admin = 'admin'
      and coalesce(u.is_active, true)
  )
);

-- ============================================================
-- compensatorys
-- ============================================================

drop policy if exists "Enable update " on public.compensatorys;
drop policy if exists "Enable insert" on public.compensatorys;

create policy "Users can insert own compensatorys"
on public.compensatorys
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Only active admins can update compensatorys"
on public.compensatorys
for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.admin = 'admin'
      and coalesce(u.is_active, true)
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.admin = 'admin'
      and coalesce(u.is_active, true)
  )
);

-- ============================================================
-- vacation_grants / vacation_grant_consumptions
-- (introduced in 20260527002614, SELECT was open to any authenticated user)
-- No feature in the app reads other users' grant balances outside the
-- admin surface (actions/admin/vacation-grants/*) and each user's own
-- summary (actions/getUserVacationGrantSummary.ts), so this can be
-- tightened without breaking anything.
-- ============================================================

drop policy if exists "Authenticated users can read vacation grants" on public.vacation_grants;

create policy "Users can read own vacation grants or admins read all"
on public.vacation_grants
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.admin = 'admin'
      and coalesce(u.is_active, true)
  )
);

drop policy if exists "Authenticated users can read vacation grant consumptions" on public.vacation_grant_consumptions;

create policy "Users can read own grant consumptions or admins read all"
on public.vacation_grant_consumptions
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.admin = 'admin'
      and coalesce(u.is_active, true)
  )
);
