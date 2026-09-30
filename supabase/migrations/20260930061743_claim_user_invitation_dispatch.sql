-- An atomic UPDATE ... WHERE NULL claim serializes invitation delivery across
-- concurrent admin requests. The claim may be reclaimed after a timeout once
-- Auth has been checked for an existing invited_at value.
alter table public.users
  add column invitation_dispatch_started_at timestamptz;
