-- Project Blueprint foundation schema
-- Migration: 20260721000000_project_blueprint.sql

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.prevent_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% rows are immutable', tg_table_name
    using errcode = 'integrity_constraint_violation';
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin profiles
-- ---------------------------------------------------------------------------

create table public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null check (role in ('reviewer', 'admin', 'approver')),
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = auth.uid()
      and ap.is_active = true
      and ap.role = any (allowed_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- Pricing
-- ---------------------------------------------------------------------------

create table public.pricing_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  checksum text not null,
  is_placeholder boolean not null default true,
  snapshot jsonb not null,
  published_at timestamptz not null default timezone('utc', now()),
  published_by uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create trigger pricing_versions_immutable_update
before update on public.pricing_versions
for each row execute function public.prevent_mutation();

create trigger pricing_versions_immutable_delete
before delete on public.pricing_versions
for each row execute function public.prevent_mutation();

create table public.pricing_drafts (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'default',
  config jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (label)
);

create trigger pricing_drafts_set_updated_at
before update on public.pricing_drafts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Estimate sessions & answers
-- ---------------------------------------------------------------------------

create table public.estimate_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  status text not null default 'in_progress'
    check (status in (
      'in_progress',
      'reviewed',
      'calculated',
      'lead_captured',
      'expired',
      'abandoned'
    )),
  answers jsonb not null default '{}'::jsonb,
  mode text check (mode is null or mode in ('guided', 'describe')),
  resume_cookie_bound boolean not null default true,
  last_screen text,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index estimate_sessions_status_idx on public.estimate_sessions (status);
create index estimate_sessions_created_at_idx on public.estimate_sessions (created_at desc);
create index estimate_sessions_expires_at_idx on public.estimate_sessions (expires_at);
create index estimate_sessions_token_hash_idx on public.estimate_sessions (token_hash);

create trigger estimate_sessions_set_updated_at
before update on public.estimate_sessions
for each row execute function public.set_updated_at();

create table public.answer_revisions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.estimate_sessions (id) on delete cascade,
  revision integer not null,
  answers jsonb not null,
  source text not null default 'autosave'
    check (source in ('autosave', 'review_edit', 'recalculate', 'admin', 'system')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, revision)
);

create index answer_revisions_session_id_idx on public.answer_revisions (session_id, revision desc);

create table public.estimate_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.estimate_sessions (id) on delete cascade,
  pricing_version_id uuid not null references public.pricing_versions (id),
  public_result jsonb not null,
  calculation_trace jsonb not null,
  checksum text not null,
  is_discovery_first boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index estimate_results_session_id_idx on public.estimate_results (session_id, created_at desc);
create index estimate_results_created_at_idx on public.estimate_results (created_at desc);
create index estimate_results_pricing_version_id_idx on public.estimate_results (pricing_version_id);

-- ---------------------------------------------------------------------------
-- Leads & uploads
-- ---------------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.estimate_sessions (id) on delete cascade,
  name text not null,
  email text not null,
  company text,
  phone text,
  consent boolean not null default false,
  consent_at timestamptz,
  preferred_next_step text
    check (
      preferred_next_step is null
      or preferred_next_step in ('email', 'call', 'workshop', 'upload_brief', 'none')
    ),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (consent = false or consent_at is not null)
);

create index leads_email_idx on public.leads (lower(email));
create index leads_created_at_idx on public.leads (created_at desc);

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create table public.uploaded_briefs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.estimate_sessions (id) on delete cascade,
  storage_path text not null unique,
  original_filename text,
  mime text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  scan_status text not null default 'pending'
    check (scan_status in ('pending', 'clean', 'infected', 'error', 'skipped')),
  scan_detail jsonb not null default '{}'::jsonb,
  consent boolean not null default false,
  consent_at timestamptz,
  uploaded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  check (consent = false or consent_at is not null)
);

create index uploaded_briefs_session_id_idx on public.uploaded_briefs (session_id);
create index uploaded_briefs_scan_status_idx on public.uploaded_briefs (scan_status);
create index uploaded_briefs_created_at_idx on public.uploaded_briefs (created_at desc);

-- ---------------------------------------------------------------------------
-- Reviewed quotations
-- ---------------------------------------------------------------------------

create table public.reviewed_quotations (
  id uuid primary key default gen_random_uuid(),
  estimate_result_id uuid not null references public.estimate_results (id) on delete restrict,
  status text not null default 'draft'
    check (status in (
      'draft',
      'in_review',
      'pending_approval',
      'approved',
      'issued',
      'accepted',
      'declined',
      'withdrawn'
    )),
  assigned_to uuid references public.admin_profiles (id) on delete set null,
  title text,
  currency text not null default 'ZAR',
  selected_scenario text,
  internal_notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index reviewed_quotations_status_idx on public.reviewed_quotations (status);
create index reviewed_quotations_created_at_idx on public.reviewed_quotations (created_at desc);
create index reviewed_quotations_assigned_to_idx on public.reviewed_quotations (assigned_to);
create index reviewed_quotations_estimate_result_id_idx on public.reviewed_quotations (estimate_result_id);

create trigger reviewed_quotations_set_updated_at
before update on public.reviewed_quotations
for each row execute function public.set_updated_at();

create table public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.reviewed_quotations (id) on delete cascade,
  version_number integer not null,
  status text not null default 'draft'
    check (status in ('draft', 'frozen', 'issued', 'superseded')),
  frozen_snapshot jsonb not null default '{}'::jsonb,
  line_items_snapshot jsonb not null default '[]'::jsonb,
  milestones_snapshot jsonb not null default '[]'::jsonb,
  overrides jsonb not null default '[]'::jsonb,
  override_reasons jsonb not null default '[]'::jsonb,
  subtotal_zar numeric(14, 2),
  tax_zar numeric(14, 2),
  total_zar numeric(14, 2),
  issued_at timestamptz,
  issued_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (quotation_id, version_number)
);

create index quote_versions_quotation_id_idx on public.quote_versions (quotation_id, version_number desc);
create index quote_versions_status_idx on public.quote_versions (status);

-- Issued/frozen quote versions are immutable
create or replace function public.prevent_issued_quote_version_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.status in ('frozen', 'issued') then
      raise exception 'Issued or frozen quote_versions cannot be deleted'
        using errcode = 'integrity_constraint_violation';
    end if;
    return old;
  end if;

  if old.status in ('frozen', 'issued') then
    raise exception 'Issued or frozen quote_versions cannot be updated'
      using errcode = 'integrity_constraint_violation';
  end if;
  return new;
end;
$$;

create trigger quote_versions_protect_issued
before update or delete on public.quote_versions
for each row execute function public.prevent_issued_quote_version_mutation();

create table public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid not null references public.quote_versions (id) on delete cascade,
  sort_order integer not null default 0,
  kind text not null default 'work_package'
    check (kind in ('work_package', 'role', 'custom', 'third_party', 'discount', 'other')),
  label text not null,
  description text,
  quantity numeric(12, 2) not null default 1,
  unit_amount_zar numeric(14, 2) not null default 0,
  amount_zar numeric(14, 2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index quote_line_items_quote_version_id_idx on public.quote_line_items (quote_version_id, sort_order);

create table public.quote_milestones (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid not null references public.quote_versions (id) on delete cascade,
  sort_order integer not null default 0,
  label text not null,
  description text,
  percent numeric(5, 2),
  amount_zar numeric(14, 2),
  due_label text,
  created_at timestamptz not null default timezone('utc', now())
);

create index quote_milestones_quote_version_id_idx on public.quote_milestones (quote_version_id, sort_order);

create table public.quote_approvals (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid not null references public.quote_versions (id) on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  approver_user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  threshold_label text,
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index quote_approvals_quote_version_id_idx on public.quote_approvals (quote_version_id);
create index quote_approvals_status_idx on public.quote_approvals (status);

-- ---------------------------------------------------------------------------
-- Analytics, calibration, audit
-- ---------------------------------------------------------------------------

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  session_id uuid references public.estimate_sessions (id) on delete set null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  check (event_name ~ '^[a-z][a-z0-9_]*$')
);

create index analytics_events_event_name_idx on public.analytics_events (event_name);
create index analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index analytics_events_session_id_idx on public.analytics_events (session_id);

create table public.calibration_records (
  id uuid primary key default gen_random_uuid(),
  estimate_result_id uuid references public.estimate_results (id) on delete set null,
  quotation_id uuid references public.reviewed_quotations (id) on delete set null,
  quote_version_id uuid references public.quote_versions (id) on delete set null,
  original_estimate_snapshot jsonb not null default '{}'::jsonb,
  reviewed_quote_snapshot jsonb not null default '{}'::jsonb,
  agreed_scope_snapshot jsonb not null default '{}'::jsonb,
  actual_effort_hours numeric(12, 2),
  actual_duration_weeks numeric(8, 2),
  change_requests jsonb not null default '[]'::jsonb,
  variance_reasons jsonb not null default '[]'::jsonb,
  recommendations text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index calibration_records_created_at_idx on public.calibration_records (created_at desc);
create index calibration_records_estimate_result_id_idx on public.calibration_records (estimate_result_id);

create trigger calibration_records_set_updated_at
before update on public.calibration_records
for each row execute function public.set_updated_at();

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_events_created_at_idx on public.audit_events (created_at desc);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id);
create index audit_events_actor_user_id_idx on public.audit_events (actor_user_id);

create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events are append-only'
    using errcode = 'integrity_constraint_violation';
end;
$$;

create trigger audit_events_append_only_update
before update on public.audit_events
for each row execute function public.prevent_audit_mutation();

create trigger audit_events_append_only_delete
before delete on public.audit_events
for each row execute function public.prevent_audit_mutation();

-- Append-only audit helper (call from server with service role or authenticated admin)
create or replace function public.write_audit_event(
  p_actor_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, metadata)
  values (p_actor_user_id, p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security — default deny; service role bypasses RLS
-- ---------------------------------------------------------------------------

alter table public.admin_profiles enable row level security;
alter table public.pricing_versions enable row level security;
alter table public.pricing_drafts enable row level security;
alter table public.estimate_sessions enable row level security;
alter table public.answer_revisions enable row level security;
alter table public.estimate_results enable row level security;
alter table public.leads enable row level security;
alter table public.uploaded_briefs enable row level security;
alter table public.reviewed_quotations enable row level security;
alter table public.quote_versions enable row level security;
alter table public.quote_line_items enable row level security;
alter table public.quote_milestones enable row level security;
alter table public.quote_approvals enable row level security;
alter table public.analytics_events enable row level security;
alter table public.calibration_records enable row level security;
alter table public.audit_events enable row level security;

-- No anon/authenticated policies for customer PII or traces by default.
-- Server uses service role after validating session tokens / admin roles.

-- Admins may read/manage operational tables
create policy admin_profiles_select_self_or_admin
on public.admin_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin_role(array['admin', 'approver', 'reviewer'])
);

create policy admin_profiles_admin_write
on public.admin_profiles
for all
to authenticated
using (public.is_admin_role(array['admin']))
with check (public.is_admin_role(array['admin']));

create policy pricing_versions_admin_select
on public.pricing_versions
for select
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']));

-- Inserts of new versions allowed for admin (updates/deletes blocked by trigger)
create policy pricing_versions_admin_insert
on public.pricing_versions
for insert
to authenticated
with check (public.is_admin_role(array['admin']));

create policy pricing_drafts_admin_all
on public.pricing_drafts
for all
to authenticated
using (public.is_admin_role(array['admin']))
with check (public.is_admin_role(array['admin']));

create policy pricing_drafts_reviewer_select
on public.pricing_drafts
for select
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy estimate_sessions_admin_select
on public.estimate_sessions
for select
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy estimate_sessions_admin_update
on public.estimate_sessions
for update
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']))
with check (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy answer_revisions_admin_select
on public.answer_revisions
for select
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy estimate_results_admin_select
on public.estimate_results
for select
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy leads_admin_select
on public.leads
for select
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy leads_admin_update
on public.leads
for update
to authenticated
using (public.is_admin_role(array['admin', 'approver']))
with check (public.is_admin_role(array['admin', 'approver']));

create policy uploaded_briefs_admin_select
on public.uploaded_briefs
for select
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy reviewed_quotations_admin_all
on public.reviewed_quotations
for all
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']))
with check (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy quote_versions_admin_all
on public.quote_versions
for all
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']))
with check (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy quote_line_items_admin_all
on public.quote_line_items
for all
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']))
with check (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy quote_milestones_admin_all
on public.quote_milestones
for all
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']))
with check (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy quote_approvals_admin_all
on public.quote_approvals
for all
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']))
with check (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy analytics_events_admin_select
on public.analytics_events
for select
to authenticated
using (public.is_admin_role(array['admin', 'approver', 'reviewer']));

create policy calibration_records_admin_all
on public.calibration_records
for all
to authenticated
using (public.is_admin_role(array['admin', 'approver']))
with check (public.is_admin_role(array['admin', 'approver']));

create policy audit_events_admin_select
on public.audit_events
for select
to authenticated
using (public.is_admin_role(array['admin', 'approver']));

-- Authenticated admins may insert audit rows (service role also used from server)
create policy audit_events_admin_insert
on public.audit_events
for insert
to authenticated
with check (public.is_admin_role(array['admin', 'approver', 'reviewer']));

revoke all on function public.write_audit_event(uuid, text, text, uuid, jsonb) from public;
grant execute on function public.write_audit_event(uuid, text, text, uuid, jsonb) to authenticated, service_role;
grant execute on function public.is_admin_role(text[]) to authenticated, service_role;

comment on table public.pricing_versions is 'Immutable published pricing snapshots for Project Blueprint.';
comment on table public.estimate_results is 'Public result + private calculation_trace; never expose trace to clients.';
comment on table public.audit_events is 'Append-only audit log for admin and system actions.';
