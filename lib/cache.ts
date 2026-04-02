export const PUBLIC_PAGE_REVALIDATE_SECONDS = 60 * 5;
export const PUBLIC_API_CACHE_CONTROL = `public, max-age=0, s-maxage=${PUBLIC_PAGE_REVALIDATE_SECONDS}, stale-while-revalidate=86400`;
export const PUBLIC_NOT_FOUND_CACHE_CONTROL =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=600";
export const PRIVATE_NO_STORE_CACHE_CONTROL =
  "private, no-store, max-age=0, must-revalidate";

export function getPublicApiCacheHeaders(found = true) {
  return {
    "Cache-Control": found
      ? PUBLIC_API_CACHE_CONTROL
      : PUBLIC_NOT_FOUND_CACHE_CONTROL,
  } satisfies HeadersInit;
}
