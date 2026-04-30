create table if not exists public.ins_pick_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  native_name text not null default '',
  subtitle text not null default '',
  description text not null default '',
  aliases text[] not null default '{}',
  required_tags text[] not null default '{}',
  r2_prefix text not null,
  status text not null default 'active' check (status in ('active', 'planned')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ins_pick_collections_status_idx
  on public.ins_pick_collections (status);

create index if not exists ins_pick_collections_created_at_idx
  on public.ins_pick_collections (created_at desc);

alter table public.ins_pick_collections enable row level security;
alter table public.ins_pick_collections force row level security;

revoke all on table public.ins_pick_collections from public, anon, authenticated;
grant all on table public.ins_pick_collections to service_role;
