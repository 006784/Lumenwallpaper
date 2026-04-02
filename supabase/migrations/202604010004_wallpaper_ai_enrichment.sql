alter table public.wallpapers
  add column if not exists ai_tags text[] not null default '{}',
  add column if not exists ai_category text,
  add column if not exists ai_caption text,
  add column if not exists ai_provider text,
  add column if not exists ai_model text,
  add column if not exists ai_analysis_status text not null default 'skipped',
  add column if not exists ai_analysis_error text,
  add column if not exists ai_analyzed_at timestamptz;

create index if not exists wallpapers_ai_analysis_status_idx
  on public.wallpapers (ai_analysis_status);
