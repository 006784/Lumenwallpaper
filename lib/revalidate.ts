import { revalidatePath, revalidateTag } from "next/cache";

function tryRevalidateTag(tag: string) {
  try {
    revalidateTag(tag);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("static generation store missing")
    ) {
      return;
    }

    throw error;
  }
}

function tryRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("static generation store missing")
    ) {
      return;
    }

    throw error;
  }
}

export function revalidateWallpaperPublicData(options?: {
  insPickCollectionSlugs?: Array<string | null | undefined>;
  creatorUsernames?: Array<string | null | undefined>;
  identifiers?: Array<string | number | null | undefined>;
}) {
  tryRevalidateTag("wallpapers");
  tryRevalidateTag("wallpapers:featured");
  tryRevalidateTag("wallpapers:explore");
  tryRevalidateTag("creators");

  for (const identifier of options?.identifiers ?? []) {
    if (identifier === null || identifier === undefined) {
      continue;
    }

    const normalized = String(identifier).trim();

    if (!normalized) {
      continue;
    }

    tryRevalidateTag(`wallpaper:${normalized}`);
    tryRevalidatePath(`/wallpaper/${normalized}`);
  }

  for (const username of options?.creatorUsernames ?? []) {
    const normalized = username?.trim();

    if (!normalized) {
      continue;
    }

    tryRevalidateTag(`creator:${normalized}`);
    tryRevalidatePath(`/creator/${normalized}`);
  }

  tryRevalidatePath("/");
  tryRevalidatePath("/explore");
  tryRevalidatePath("/darkroom");
  tryRevalidatePath("/ins");

  for (const slug of options?.insPickCollectionSlugs ?? []) {
    const normalized = slug?.trim();

    if (!normalized) {
      continue;
    }

    tryRevalidatePath(`/ins/${normalized}`);
  }
}
