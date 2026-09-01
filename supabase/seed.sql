-- PLACEHOLDER seed for Project Blueprint pricing.
-- ⚠ These rates and effort ranges are clearly labelled placeholders.
-- Replace via an authorised published pricing_version after calibration.
-- Safe for `supabase db reset`.

insert into public.pricing_drafts (label, config)
values (
  'default',
  jsonb_build_object(
    'note', 'PLACEHOLDER draft — edit in admin then publish a new version',
    'currency', 'ZAR',
    'isPlaceholder', true
  )
)
on conflict (label) do update
set config = excluded.config,
    updated_at = timezone('utc', now());

-- Published immutable snapshot (placeholder). Checksum is illustrative for local/dev.
insert into public.pricing_versions (
  version,
  checksum,
  is_placeholder,
  snapshot,
  notes
)
select
  'placeholder-v0.1.0',
  'seed-placeholder-v0.1.0',
  true,
  jsonb_build_object(
    'pricingVersion', 'placeholder-v0.1.0',
    'isPlaceholder', true,
    'currency', 'ZAR',
    'roles', jsonb_build_array(
      jsonb_build_object('roleId', 'principal', 'title', 'Principal (PLACEHOLDER)', 'sellRateZarPerHour', 2850),
      jsonb_build_object('roleId', 'architect', 'title', 'Architect (PLACEHOLDER)', 'sellRateZarPerHour', 2450),
      jsonb_build_object('roleId', 'senior_engineer', 'title', 'Senior engineer (PLACEHOLDER)', 'sellRateZarPerHour', 1950),
      jsonb_build_object('roleId', 'engineer', 'title', 'Engineer (PLACEHOLDER)', 'sellRateZarPerHour', 1450),
      jsonb_build_object('roleId', 'designer', 'title', 'Designer (PLACEHOLDER)', 'sellRateZarPerHour', 1650),
      jsonb_build_object('roleId', 'qa', 'title', 'QA (PLACEHOLDER)', 'sellRateZarPerHour', 1250),
      jsonb_build_object('roleId', 'security', 'title', 'Security (PLACEHOLDER)', 'sellRateZarPerHour', 2150),
      jsonb_build_object('roleId', 'pm', 'title', 'Delivery PM (PLACEHOLDER)', 'sellRateZarPerHour', 1550),
      jsonb_build_object('roleId', 'devops', 'title', 'Cloud/DevOps (PLACEHOLDER)', 'sellRateZarPerHour', 1850)
    ),
    'commercial', jsonb_build_object(
      'taxRate', 0.15,
      'targetMargin', 0.35,
      'minimumEngagementZar', 150000,
      'roundingBands', jsonb_build_array(
        jsonb_build_object('upToExclusive', 250000, 'step', 5000),
        jsonb_build_object('upToExclusive', 750000, 'step', 25000),
        jsonb_build_object('upToExclusive', 2000000, 'step', 50000),
        jsonb_build_object('upToExclusive', 1000000000, 'step', 100000)
      )
    ),
    'source', 'lib/project-blueprint/engine/config/placeholder.ts'
  ),
  'PLACEHOLDER seed — do not use for binding client quotations until calibrated.'
where not exists (
  select 1 from public.pricing_versions where version = 'placeholder-v0.1.0'
);
