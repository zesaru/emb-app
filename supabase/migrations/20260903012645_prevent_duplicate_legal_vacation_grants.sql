-- Manual reconciliation entries may share a statutory date with the legal
-- entitlement they document. Only standard and proportional grants represent
-- an automatically calculated legal milestone and must be unique.
create unique index if not exists vacation_grants_unique_legal_milestone_idx
  on public.vacation_grants (user_id, granted_on, service_band)
  where rule_type in ('standard', 'proportional');

comment on index public.vacation_grants_unique_legal_milestone_idx is
  'Prevents concurrent cron/admin issuance of the same statutory vacation grant while preserving manual reconciliations';
