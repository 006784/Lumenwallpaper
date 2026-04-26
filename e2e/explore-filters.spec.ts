import { expect, test } from "@playwright/test";

type WallpaperApiFile = {
  height: number | null;
  width: number | null;
};

type WallpaperApiItem = {
  colors: string[];
  files: WallpaperApiFile[];
  height: number | null;
  slug: string;
  videoUrl: string | null;
  width: number | null;
};

type WallpaperListPagePayload = {
  count: number;
  filters: {
    aspect: string | null;
    color: string | null;
    media: string;
    orientation: string | null;
    resolution: string | null;
    sort: string;
  };
  total: number;
  wallpapers: WallpaperApiItem[];
};

function getBestDimensions(wallpaper: WallpaperApiItem) {
  return [
    {
      height: wallpaper.height,
      width: wallpaper.width,
    },
    ...wallpaper.files,
  ]
    .filter((item): item is { height: number; width: number } =>
      Boolean(item.width && item.height),
    )
    .sort((left, right) => {
      return right.width * right.height - left.width * left.height;
    })[0];
}

function expectPortraitPhone1080p(wallpaper: WallpaperApiItem) {
  const dimensions = getBestDimensions(wallpaper);

  expect(dimensions, `${wallpaper.slug} should have dimensions`).toBeTruthy();

  if (!dimensions) {
    return;
  }

  const ratio = dimensions.width / dimensions.height;
  const longEdge = Math.max(dimensions.width, dimensions.height);
  const shortEdge = Math.min(dimensions.width, dimensions.height);

  expect(ratio, `${wallpaper.slug} should be portrait`).toBeLessThan(0.9);
  expect(
    ratio,
    `${wallpaper.slug} should match phone-ish ratios`,
  ).toBeGreaterThanOrEqual(0.42);
  expect(
    ratio,
    `${wallpaper.slug} should match phone-ish ratios`,
  ).toBeLessThanOrEqual(0.8);
  expect(
    longEdge >= 1920 || shortEdge >= 1080,
    `${wallpaper.slug} should be 1080p+`,
  ).toBe(true);
}

test.describe("探索页智能筛选 API", () => {
  test("支持分辨率、方向、手机比例、媒体类型和排序组合", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/wallpapers?withMeta=true&media=static&orientation=portrait&aspect=phone&resolution=1080p&sort=downloads&limit=24",
    );

    expect(response.ok()).toBe(true);

    const payload = (await response.json()) as {
      data: WallpaperListPagePayload;
    };

    expect(payload.data.filters).toMatchObject({
      aspect: "phone",
      media: "static",
      orientation: "portrait",
      resolution: "1080p",
      sort: "popular",
    });

    test.skip(
      payload.data.wallpapers.length === 0,
      "当前环境没有符合组合筛选的壁纸，跳过逐项匹配断言",
    );

    for (const wallpaper of payload.data.wallpapers) {
      expect(
        wallpaper.videoUrl,
        `${wallpaper.slug} should be static`,
      ).toBeNull();
      expectPortraitPhone1080p(wallpaper);
    }
  });

  test("支持颜色筛选并在分页元数据中回显", async ({ request }) => {
    const seedResponse = await request.get("/api/wallpapers?limit=24");
    expect(seedResponse.ok()).toBe(true);

    const seedPayload = (await seedResponse.json()) as {
      data: WallpaperApiItem[];
    };
    const seed = seedPayload.data.find((wallpaper) => wallpaper.colors[0]);

    test.skip(!seed, "当前环境没有带主色调的壁纸，跳过颜色筛选断言");

    const color = seed!.colors[0].replace(/^#/, "");
    const response = await request.get(
      `/api/wallpapers?withMeta=true&color=${encodeURIComponent(color)}&limit=12`,
    );

    expect(response.ok()).toBe(true);

    const payload = (await response.json()) as {
      data: WallpaperListPagePayload;
    };

    expect(payload.data.filters.color).toBe(color);
  });

  test("非法筛选值返回结构化 400", async ({ request }) => {
    const response = await request.get(
      "/api/wallpapers?orientation=diagonal&media=cinema",
    );

    expect(response.status()).toBe(400);

    const payload = (await response.json()) as {
      code: string;
      error: string;
    };

    expect(payload).toMatchObject({
      code: "INVALID_WALLPAPER_QUERY",
      error: "Invalid wallpaper query parameters.",
    });
  });
});
