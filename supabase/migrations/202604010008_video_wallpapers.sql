alter table if exists public.wallpapers
  add column if not exists video_url text;

comment on column public.wallpapers.video_url is
  'Optional preview video URL for animated wallpapers.';
