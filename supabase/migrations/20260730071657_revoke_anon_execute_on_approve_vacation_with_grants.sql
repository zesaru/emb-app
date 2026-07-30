-- Corrective follow-up to 20260730071549: `REVOKE ... FROM PUBLIC` on
-- approve_vacation_with_grants did not actually remove anon's EXECUTE
-- privilege, and the security advisor still flagged it afterwards.
--
-- Root cause: 20260323000000_remote_public_schema.sql set
-- `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON
-- FUNCTIONS TO anon` -- every function later created by the postgres role
-- (including this one, added in 202603260005) gets EXECUTE granted to anon
-- as a real, explicit ACL entry, not as an inherited PUBLIC default. So
-- `REVOKE ... FROM PUBLIC` is a no-op for it; anon has to be revoked by name.
--
-- `authenticated` is left untouched on purpose: the admin approval flow
-- calls this RPC directly as the signed-in admin, and the function already
-- re-checks caller identity internally (NOT_AUTHORIZED / APPROVER_MISMATCH).

REVOKE EXECUTE ON FUNCTION public.approve_vacation_with_grants(
  uuid, uuid, integer, uuid, timestamptz, integer, boolean
) FROM anon;
