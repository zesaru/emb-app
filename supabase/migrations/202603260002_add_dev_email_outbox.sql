create table if not exists public.dev_email_outbox (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  delivery_mode text not null check (delivery_mode in ('captured', 'sent')),
  template_name text not null,
  from_email text not null,
  to_emails text[] not null default '{}',
  subject text not null,
  html_body text not null,
  text_body text,
  payload_json jsonb,
  triggered_by_user_id uuid references public.users(id) on delete set null
);

create index if not exists dev_email_outbox_created_at_idx
  on public.dev_email_outbox (created_at desc);

create index if not exists dev_email_outbox_template_name_idx
  on public.dev_email_outbox (template_name);
