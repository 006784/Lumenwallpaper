do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'users'
  ) then
    raise exception 'Missing table public.users. Run supabase/repair_schema.sql first.';
  end if;

  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'wallpapers'
  ) then
    raise exception 'Missing table public.wallpapers. Run supabase/repair_schema.sql first.';
  end if;

  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'wallpaper_files'
  ) then
    raise exception 'Missing table public.wallpaper_files. Run supabase/repair_schema.sql first.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wallpapers'
      and column_name = 'status'
  ) then
    raise exception 'Missing column public.wallpapers.status. Run supabase/repair_schema.sql first.';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wallpapers'
      and column_name = 'category_id'
      and is_nullable = 'NO'
  ) then
    raise exception 'Legacy column public.wallpapers.category_id is still NOT NULL. Run the latest supabase/repair_schema.sql first.';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wallpapers'
      and (
        column_name like '%url%'
        or column_name like '%thumbnail%'
        or column_name in (
          'thumbnail',
          'thumb',
          'image',
          'cover',
          'cover_image',
          'hero_image',
          'image_path',
          'file_path',
          'src'
        )
      )
      and is_nullable = 'NO'
  ) then
    raise exception 'Legacy wallpaper media columns are still NOT NULL. Run the latest supabase/repair_schema.sql first.';
  end if;
end
$$;

insert into public.users (email, username, avatar_url, bio)
values
  (
    'lin-yue@frame.app',
    'lin-yue',
    'https://picsum.photos/id/1005/400/400',
    '偏爱山谷、晨雾和极轻的自然光，常驻 FRAME 自然策展区。'
  ),
  (
    'maya-chen@frame.app',
    'maya-chen',
    'https://picsum.photos/id/1011/400/400',
    '做宇宙、极简和色块实验，也拍情绪很重的静物。'
  ),
  (
    'jun-park@frame.app',
    'jun-park',
    'https://picsum.photos/id/1027/400/400',
    '城市夜景与潮湿街道爱好者，喜欢让画面保留一点噪声。'
  )
on conflict (username) do update
set
  email = excluded.email,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio;

insert into public.wallpapers (
  user_id,
  title,
  slug,
  description,
  status,
  tags,
  colors,
  width,
  height,
  downloads_count,
  likes_count,
  featured
)
select
  u.id,
  '消失于翡翠山谷的晨雾',
  'emerald-morning-mist',
  'Lin Yue 在清晨六点捕捉到雾气穿过山谷的瞬间，整张画面保留了微湿的空气感。',
  'published',
  array['自然', '晨雾', '山谷'],
  array['#2a3b24', '#738f67', '#dce6cf'],
  2400,
  1600,
  2847,
  913,
  true
from public.users u
where u.username = 'lin-yue'
on conflict (slug) do update
set
  user_id = excluded.user_id,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  tags = excluded.tags,
  colors = excluded.colors,
  width = excluded.width,
  height = excluded.height,
  downloads_count = excluded.downloads_count,
  likes_count = excluded.likes_count,
  featured = excluded.featured;

insert into public.wallpapers (
  user_id,
  title,
  slug,
  description,
  status,
  tags,
  colors,
  width,
  height,
  downloads_count,
  likes_count,
  featured
)
select
  u.id,
  '寂静轨道',
  'orbit-of-silence',
  '一张偏竖构图的宇宙系壁纸，适合锁屏和深色桌面。',
  'published',
  array['宇宙', '极简', '暗夜'],
  array['#090d18', '#39406d', '#d0d8f0'],
  1800,
  2400,
  1936,
  704,
  true
from public.users u
where u.username = 'maya-chen'
on conflict (slug) do update
set
  user_id = excluded.user_id,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  tags = excluded.tags,
  colors = excluded.colors,
  width = excluded.width,
  height = excluded.height,
  downloads_count = excluded.downloads_count,
  likes_count = excluded.likes_count,
  featured = excluded.featured;

insert into public.wallpapers (
  user_id,
  title,
  slug,
  description,
  status,
  tags,
  colors,
  width,
  height,
  downloads_count,
  likes_count,
  featured
)
select
  u.id,
  '午夜横穿者',
  'midnight-crossing',
  '潮湿柏油路面反射着高对比霓虹，适合做城市感的宽屏壁纸。',
  'published',
  array['城市', '暗夜', '霓虹'],
  array['#0a0c10', '#29435f', '#ff7a59'],
  2560,
  1440,
  1674,
  622,
  false
from public.users u
where u.username = 'jun-park'
on conflict (slug) do update
set
  user_id = excluded.user_id,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  tags = excluded.tags,
  colors = excluded.colors,
  width = excluded.width,
  height = excluded.height,
  downloads_count = excluded.downloads_count,
  likes_count = excluded.likes_count,
  featured = excluded.featured;

insert into public.wallpapers (
  user_id,
  title,
  slug,
  description,
  status,
  tags,
  colors,
  width,
  height,
  downloads_count,
  likes_count,
  featured
)
select
  u.id,
  '雨后的余烬',
  'embers-under-rain',
  '低饱和雨夜里的一束暖色，适合暗色系桌面与编辑精选区。',
  'published',
  array['暗色', '雨夜', '暖光'],
  array['#1a1512', '#8d4a2f', '#e4b58c'],
  1600,
  2400,
  1208,
  417,
  false
from public.users u
where u.username = 'jun-park'
on conflict (slug) do update
set
  user_id = excluded.user_id,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  tags = excluded.tags,
  colors = excluded.colors,
  width = excluded.width,
  height = excluded.height,
  downloads_count = excluded.downloads_count,
  likes_count = excluded.likes_count,
  featured = excluded.featured;

insert into public.wallpapers (
  user_id,
  title,
  slug,
  description,
  status,
  tags,
  colors,
  width,
  height,
  downloads_count,
  likes_count,
  featured
)
select
  u.id,
  '冰川呼吸',
  'glacier-breath',
  '一张偏冷调的竖构图，给移动端锁屏和极简桌面都很合适。',
  'published',
  array['冰川', '极简', '冷调'],
  array['#dfecef', '#9ec9d6', '#4f7d8e'],
  1800,
  2400,
  1512,
  588,
  false
from public.users u
where u.username = 'maya-chen'
on conflict (slug) do update
set
  user_id = excluded.user_id,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  tags = excluded.tags,
  colors = excluded.colors,
  width = excluded.width,
  height = excluded.height,
  downloads_count = excluded.downloads_count,
  likes_count = excluded.likes_count,
  featured = excluded.featured;

insert into public.wallpapers (
  user_id,
  title,
  slug,
  description,
  status,
  tags,
  colors,
  width,
  height,
  downloads_count,
  likes_count,
  featured
)
select
  u.id,
  '粉色地平线',
  'blush-horizon',
  '柔和的暖粉色横幅构图，适合作为首页情绪版和编辑推荐候选。',
  'published',
  array['渐变', '暖调', '极简'],
  array['#f6dfdc', '#f2b8b1', '#cf7c76'],
  2400,
  1600,
  980,
  305,
  false
from public.users u
where u.username = 'maya-chen'
on conflict (slug) do update
set
  user_id = excluded.user_id,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  tags = excluded.tags,
  colors = excluded.colors,
  width = excluded.width,
  height = excluded.height,
  downloads_count = excluded.downloads_count,
  likes_count = excluded.likes_count,
  featured = excluded.featured;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'preview',
  'seed/emerald-morning-mist-preview.jpg',
  'https://picsum.photos/id/1018/1200/800',
  240000,
  'jpg',
  1200,
  800
from public.wallpapers w
where w.slug = 'emerald-morning-mist'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'original',
  'seed/emerald-morning-mist-original.jpg',
  'https://picsum.photos/id/1018/2400/1600',
  780000,
  'jpg',
  2400,
  1600
from public.wallpapers w
where w.slug = 'emerald-morning-mist'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'preview',
  'seed/orbit-of-silence-preview.jpg',
  'https://picsum.photos/id/1025/900/1200',
  210000,
  'jpg',
  900,
  1200
from public.wallpapers w
where w.slug = 'orbit-of-silence'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'original',
  'seed/orbit-of-silence-original.jpg',
  'https://picsum.photos/id/1025/1800/2400',
  690000,
  'jpg',
  1800,
  2400
from public.wallpapers w
where w.slug = 'orbit-of-silence'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'preview',
  'seed/midnight-crossing-preview.jpg',
  'https://picsum.photos/id/1011/1200/675',
  225000,
  'jpg',
  1200,
  675
from public.wallpapers w
where w.slug = 'midnight-crossing'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'original',
  'seed/midnight-crossing-original.jpg',
  'https://picsum.photos/id/1011/2560/1440',
  810000,
  'jpg',
  2560,
  1440
from public.wallpapers w
where w.slug = 'midnight-crossing'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'preview',
  'seed/embers-under-rain-preview.jpg',
  'https://picsum.photos/id/1003/900/1350',
  235000,
  'jpg',
  900,
  1350
from public.wallpapers w
where w.slug = 'embers-under-rain'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'original',
  'seed/embers-under-rain-original.jpg',
  'https://picsum.photos/id/1003/1600/2400',
  720000,
  'jpg',
  1600,
  2400
from public.wallpapers w
where w.slug = 'embers-under-rain'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'preview',
  'seed/glacier-breath-preview.jpg',
  'https://picsum.photos/id/1015/900/1200',
  205000,
  'jpg',
  900,
  1200
from public.wallpapers w
where w.slug = 'glacier-breath'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'original',
  'seed/glacier-breath-original.jpg',
  'https://picsum.photos/id/1015/1800/2400',
  660000,
  'jpg',
  1800,
  2400
from public.wallpapers w
where w.slug = 'glacier-breath'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'preview',
  'seed/blush-horizon-preview.jpg',
  'https://picsum.photos/id/1016/1200/800',
  215000,
  'jpg',
  1200,
  800
from public.wallpapers w
where w.slug = 'blush-horizon'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;

insert into public.wallpaper_files (
  wallpaper_id,
  variant,
  storage_path,
  url,
  size,
  format,
  width,
  height
)
select
  w.id,
  'original',
  'seed/blush-horizon-original.jpg',
  'https://picsum.photos/id/1016/2400/1600',
  700000,
  'jpg',
  2400,
  1600
from public.wallpapers w
where w.slug = 'blush-horizon'
on conflict (wallpaper_id, variant) do update
set
  storage_path = excluded.storage_path,
  url = excluded.url,
  size = excluded.size,
  format = excluded.format,
  width = excluded.width,
  height = excluded.height;
