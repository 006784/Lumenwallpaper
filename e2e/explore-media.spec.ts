import { expect, test } from "@playwright/test";

type WallpaperApiFile = {
  format: string | null;
  height: number | null;
  storagePath: string;
  url: string;
  variant: "original" | "4k" | "thumb" | "preview";
  width: number | null;
};

type WallpaperApiItem = {
  files: WallpaperApiFile[];
  height: number | null;
  slug: string;
  title: string;
  videoUrl: string | null;
  width: number | null;
};

function isVideoFile(file: WallpaperApiFile) {
  return (
    file.format?.startsWith("video/") ||
    /\.(mp4|webm|mov)$/i.test(file.url) ||
    /\.(mp4|webm|mov)$/i.test(file.storagePath)
  );
}

function getMediaReadinessScore(wallpaper: WallpaperApiItem) {
  const imageFiles = wallpaper.files.filter((file) => !isVideoFile(file));
  const variants = new Set(imageFiles.map((file) => file.variant));
  const hasTopLevelDimensions = Boolean(wallpaper.width && wallpaper.height);
  const hasImageDimensions = imageFiles.some(
    (file) => file.width && file.height,
  );
  const everyImageFileHasDimensions =
    imageFiles.length > 0 &&
    imageFiles.every((file) => file.width && file.height);

  if (wallpaper.videoUrl) {
    return (
      20 +
      (imageFiles.length > 0 ? 30 : 0) +
      (variants.has("preview") ? 18 : 0) +
      (variants.has("thumb") ? 12 : 0) +
      (hasTopLevelDimensions || hasImageDimensions ? 12 : 0)
    );
  }

  return (
    (imageFiles.length > 0 ? 20 : 0) +
    (variants.has("preview") ? 24 : 0) +
    (variants.has("thumb") ? 18 : 0) +
    (variants.has("4k") ? 12 : 0) +
    (variants.has("original") ? 8 : 0) +
    (hasTopLevelDimensions ? 10 : 0) +
    (hasImageDimensions ? 6 : 0) +
    (everyImageFileHasDimensions ? 4 : 0)
  );
}

test.describe("探索页媒体质量排序", () => {
  test("公开列表优先返回封面和尺寸完整的壁纸", async ({ request }) => {
    const response = await request.get("/api/wallpapers?limit=24");

    expect(response.ok()).toBe(true);

    const payload = (await response.json()) as {
      data: WallpaperApiItem[];
    };
    const wallpapers = payload.data;

    test.skip(wallpapers.length < 2, "当前环境壁纸数据不足，跳过排序断言");

    const scores = wallpapers.map((wallpaper) => ({
      score: getMediaReadinessScore(wallpaper),
      slug: wallpaper.slug,
    }));

    for (let index = 1; index < scores.length; index += 1) {
      expect(
        scores[index - 1].score,
        `${scores[index - 1].slug} should not rank behind ${scores[index].slug}`,
      ).toBeGreaterThanOrEqual(scores[index].score);
    }
  });
});
