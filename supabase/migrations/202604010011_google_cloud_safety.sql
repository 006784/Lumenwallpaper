alter table public.wallpapers
  add column if not exists safety_provider text,
  add column if not exists safety_status text not null default 'skipped',
  add column if not exists safety_risk_level text,
  add column if not exists safety_adult text,
  add column if not exists safety_racy text,
  add column if not exists safety_violence text,
  add column if not exists safety_medical text,
  add column if not exists safety_spoof text,
  add column if not exists safety_labels text[] not null default '{}',
  add column if not exists safety_checked_at timestamptz,
  add column if not exists safety_error text;

create index if not exists wallpapers_safety_status_idx
  on public.wallpapers (safety_status);

create index if not exists wallpapers_safety_risk_level_idx
  on public.wallpapers (safety_risk_level);
