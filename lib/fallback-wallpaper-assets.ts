import type { GradientKey } from "@/types/home";

export const FALLBACK_WALLPAPER_STORAGE_PREFIX = "lumen-fallback";

const FALLBACK_COLORS: Record<GradientKey, readonly [string, string, string]> = {
  blush: ["#f0a7b5", "#f8d6dc", "#8b3f55"],
  dusk: ["#f7b267", "#5f4b8b", "#1b1b3a"],
  ember: ["#f25f4c", "#8a2f1f", "#1b0d0a"],
  forest: ["#133d2a", "#4f8a5b", "#d7c8a1"],
  ice: ["#d9f2ff", "#78a8c7", "#243b55"],
  lava: ["#ff512f", "#dd2476", "#1b0d0a"],
  moss: ["#596b2f", "#9ca86f", "#21311c"],
  night: ["#06070f", "#1f2f59", "#8ca6db"],
  ocean: ["#0f2027", "#2c5364", "#9bd8f4"],
  void: ["#090a14", "#3b2f72", "#d6c7ff"],
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function createFallbackWallpaperStoragePath(options: {
  slug: string;
  variant: string;
}) {
  return `${FALLBACK_WALLPAPER_STORAGE_PREFIX}/${options.slug}-${options.variant}.svg`;
}

export function createFallbackWallpaperAssetUrl(options: {
  slug: string;
  variant: string;
}) {
  return `/api/wallpapers/${encodeURIComponent(options.slug)}/fallback?variant=${encodeURIComponent(options.variant)}`;
}

export function isFallbackWallpaperStoragePath(path: string | null | undefined) {
  if (!path) {
    return false;
  }

  const normalizedPath = path.trim().replace(/^\/+/, "");
  return normalizedPath.startsWith(`${FALLBACK_WALLPAPER_STORAGE_PREFIX}/`);
}

export function buildFallbackWallpaperSvg(options: {
  gradient: GradientKey;
  height: number;
  title: string;
  width: number;
}) {
  const width = Math.max(1, Math.round(options.width));
  const height = Math.max(1, Math.round(options.height));
  const title = escapeXml(options.title);
  const [start, middle, end] = FALLBACK_COLORS[options.gradient];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="lumen-bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${start}"/>
      <stop offset="52%" stop-color="${middle}"/>
      <stop offset="100%" stop-color="${end}"/>
    </linearGradient>
    <radialGradient id="lumen-light" cx="26%" cy="18%" r="72%">
      <stop offset="0%" stop-color="#fff7df" stop-opacity="0.42"/>
      <stop offset="44%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <pattern id="lumen-grid" width="96" height="96" patternUnits="userSpaceOnUse">
      <path d="M 96 0 L 0 0 0 96" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#lumen-bg)"/>
  <rect width="${width}" height="${height}" fill="url(#lumen-light)"/>
  <rect width="${width}" height="${height}" fill="url(#lumen-grid)" opacity="0.5"/>
  <path d="M ${width * 0.08} ${height * 0.78} C ${width * 0.28} ${height * 0.52}, ${width * 0.54} ${height * 0.92}, ${width * 0.92} ${height * 0.62}" fill="none" stroke="#ffffff" stroke-opacity="0.24" stroke-width="${Math.max(8, width * 0.006)}"/>
  <text x="${width * 0.08}" y="${height * 0.12}" fill="#ffffff" fill-opacity="0.72" font-family="Inter, Arial, sans-serif" font-size="${Math.max(28, width * 0.026)}" letter-spacing="14">LUMEN</text>
  <text x="${width * 0.08}" y="${height * 0.2}" fill="#ffffff" fill-opacity="0.88" font-family="Inter, Arial, sans-serif" font-size="${Math.max(42, width * 0.048)}" font-weight="700">${title}</text>
  <text x="${width * 0.08}" y="${height * 0.88}" fill="#ffffff" fill-opacity="0.62" font-family="Inter, Arial, sans-serif" font-size="${Math.max(20, width * 0.018)}" letter-spacing="8">FALLBACK WALLPAPER PREVIEW</text>
</svg>`;
}

export function createFallbackWallpaperDataUrl(
  options: Parameters<typeof buildFallbackWallpaperSvg>[0],
) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    buildFallbackWallpaperSvg(options),
  )}`;
}
