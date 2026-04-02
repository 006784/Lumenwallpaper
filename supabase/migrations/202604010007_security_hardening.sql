do $$
declare
  internal_table_name text;
  readable_table_name text;
begin
  foreach internal_table_name in array ARRAY[
    'sessions',
    'likes',
    'downloads',
    'collections',
    'collection_items',
    'wallpaper_favorites',
    'wallpaper_reports',
    'notifications'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = internal_table_name
    ) then
      execute format(
        'alter table public.%I enable row level security',
        internal_table_name
      );
      execute format(
        'alter table public.%I force row level security',
        internal_table_name
      );
      execute format(
        'revoke all on table public.%I from public, anon, authenticated',
        internal_table_name
      );
      execute format(
        'grant all on table public.%I to service_role',
        internal_table_name
      );
    end if;
  end loop;

  foreach readable_table_name in array ARRAY[
    'users',
    'wallpapers',
    'wallpaper_files'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = readable_table_name
    ) then
      execute format(
        'alter table public.%I enable row level security',
        readable_table_name
      );
      execute format(
        'revoke all on table public.%I from public, anon, authenticated',
        readable_table_name
      );
      execute format(
        'grant select on table public.%I to anon, authenticated',
        readable_table_name
      );
      execute format(
        'grant all on table public.%I to service_role',
        readable_table_name
      );
    end if;
  end loop;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'wallpaper_reports'
      and policyname = 'Wallpaper reports can be submitted'
  ) then
    drop policy "Wallpaper reports can be submitted" on public.wallpaper_reports;
  end if;
end
$$;

do $$
begin
  if to_regprocedure('public.increment_wallpaper_downloads(text)') is not null then
    revoke all
      on function public.increment_wallpaper_downloads(text)
      from public, anon, authenticated;
    grant execute
      on function public.increment_wallpaper_downloads(text)
      to service_role;
  end if;

  if to_regprocedure('public.get_wallpaper_favorite_state(text,text)') is not null then
    revoke all
      on function public.get_wallpaper_favorite_state(text, text)
      from public, anon, authenticated;
    grant execute
      on function public.get_wallpaper_favorite_state(text, text)
      to service_role;
  end if;

  if to_regprocedure('public.toggle_wallpaper_favorite(text,text)') is not null then
    revoke all
      on function public.toggle_wallpaper_favorite(text, text)
      from public, anon, authenticated;
    grant execute
      on function public.toggle_wallpaper_favorite(text, text)
      to service_role;
  end if;
end
$$;
