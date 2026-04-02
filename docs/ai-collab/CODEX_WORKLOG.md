# Codex Worklog

Last updated: 2026-04-02
Branch: `codex/initial-foundation`

## What Codex completed

### 1. Homepage real data API

- Added homepage aggregation service in `lib/home.ts`
- Added `GET /api/home` in `app/api/home/route.ts`
- Added shared response contract in `types/home-api.ts`
- Kept public cache headers aligned with the rest of the public APIs

Returned shape:

```ts
{
  moodCards,
  editorialFeature,
  editorialItems,
  darkroomItems
}
```

### 2. Creator detail backend for TASK-005

- Added `GET /api/creator/[username]` in `app/api/creator/[username]/route.ts`
- Added creator snapshot service in `lib/creators.ts`
- Added cached wrapper `getCachedCreatorPageSnapshot()` in `lib/public-wallpaper-cache.ts`
- Added shared API contract in `types/creator-api.ts`

Returned shape:

```ts
{
  creator,
  wallpapers,
  stats: {
    totalWallpapers,
    totalDownloads,
    totalLikes,
    featuredWallpapers,
    latestPublishedAt
  }
}
```

### 3. Video wallpaper backend for TASK-006

- Added migration `supabase/migrations/202604010008_video_wallpapers.sql`
- Added `video_url` to `types/database.ts`
- Added `videoUrl` to `types/wallpaper.ts`
- Wired `videoUrl` into wallpaper create/update/read mapping in `lib/wallpapers.ts`

Action still required in Supabase:

```sql
-- run this migration
supabase/migrations/202604010008_video_wallpapers.sql
```

### 4. AI tags contract for TASK-007

- Confirmed `wallpapers.ai_tags` is stored as `text[]`
- Confirmed public API returns `Wallpaper.aiTags: string[]`
- Added `aiTags?: string[]` to `MoodCardData` and `DarkroomItem` in `types/home.ts`
- Updated `lib/wallpaper-presenters.ts` so cards now receive:

```ts
aiTags: wallpaper.aiTags.slice(0, 3)
```

## Shared files updated

- `docs/ai-collab/TASK_QUEUE.md`
- `types/home.ts`

Notes:

- `types/home.ts` is a shared contract file used by Claude UI and Codex data mapping.
- The new optional fields were added in a backward-compatible way.

## Validation run by Codex

Successfully verified during this round:

- `pnpm build`
- `pnpm type-check`

Important note:

- In this repo, `pnpm type-check` may fail with missing `.next/types/...` files if it is run at the same time as `pnpm build`.
- Reliable order is: run `pnpm build` first, then run `pnpm type-check`.

## Recent Codex commits

- `8a1187e` `feat(api): add creator snapshot API and video wallpaper support`
- `dbca73b` `feat(presenters): expose ai tags on wallpaper cards`

## Current handoff summary

- TASK-005 backend is ready for Claude UI integration
- TASK-006 backend is ready once migration `202604010008_video_wallpapers.sql` is applied
- TASK-007 backend contract is ready and card presenters now expose `aiTags`
