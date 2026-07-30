-- Closes two "SECURITY DEFINER callable by anon/authenticated" advisor
-- warnings.
--
-- public.approve_vacation_with_grants: `authenticated` keeps EXECUTE
-- intentionally -- the admin approval flow calls this RPC directly as the
-- signed-in admin, and the function already re-checks caller identity
-- internally (NOT_AUTHORIZED / APPROVER_MISMATCH). This revokes the
-- implicit PUBLIC default only; see 20260730071657 for why `anon` still
-- needed a separate, explicit REVOKE.
--
-- public.insert_user_in_public_table_for_each_new_user: trigger-only
-- function (fires on auth.users insert), never called via .rpc() from the
-- app. Direct EXECUTE grants to anon/authenticated serve no purpose --
-- trigger firing does not require them -- and letting anyone invoke a
-- SECURITY DEFINER function directly is unnecessary exposure.

REVOKE EXECUTE ON FUNCTION public.approve_vacation_with_grants(
  uuid, uuid, integer, uuid, timestamptz, integer, boolean
) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.insert_user_in_public_table_for_each_new_user()
FROM PUBLIC, anon, authenticated;
