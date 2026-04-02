import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateWallpaperPublicData(options?: {
  creatorUsernames?: Array<string | null | undefined>;
  identifiers?: Array<string | number | null | undefined>;
}) {
  revalidateTag("wallpapers");
  revalidateTag("wallpapers:featured");
  revalidateTag("wallpapers:explore");
  revalidateTag("creators");

  for (const identifier of options?.identifiers ?? []) {
    if (identifier === null || identifier === undefined) {
      continue;
    }

    const normalized = String(identifier).trim();

    if (!normalized) {
      continue;
    }

    revalidateTag(`wallpaper:${normalized}`);
    revalidatePath(`/wallpaper/${normalized}`);
  }

  for (const username of options?.creatorUsernames ?? []) {
    const normalized = username?.trim();

    if (!normalized) {
      continue;
    }

    revalidateTag(`creator:${normalized}`);
    revalidatePath(`/creator/${normalized}`);
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/darkroom");
}
