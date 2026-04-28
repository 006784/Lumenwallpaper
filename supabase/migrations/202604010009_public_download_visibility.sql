create or replace function public.increment_wallpaper_downloads(p_identifier text)
returns table (
  wallpaper_id text,
  downloads_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.wallpapers w
  set downloads_count = coalesce(w.downloads_count, 0) + 1
  where w.id in (
    select w2.id
    from public.wallpapers w2
    where (w2.slug = p_identifier or w2.id::text = p_identifier)
      and w2.status = 'published'
    order by case when w2.slug = p_identifier then 0 else 1 end
    limit 1
  )
  returning w.id::text, w.downloads_count;
end;
$$;

revoke all
  on function public.increment_wallpaper_downloads(text)
  from public, anon, authenticated;

grant execute
  on function public.increment_wallpaper_downloads(text)
  to service_role;
