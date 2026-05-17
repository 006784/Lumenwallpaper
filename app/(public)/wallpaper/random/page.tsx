import { redirect } from "next/navigation";

import { getCachedPublishedWallpapers } from "@/lib/public-wallpaper-cache";

export const dynamic = "force-dynamic";

export default async function RandomWallpaperPage() {
  const wallpapers = await getCachedPublishedWallpapers({
    limit: 200,
    sort: "latest",
  }).catch(() => []);

  if (wallpapers.length === 0) {
    redirect("/explore");
  }

  const pick = wallpapers[Math.floor(Math.random() * wallpapers.length)];
  redirect(`/wallpaper/${pick.slug}`);
}
