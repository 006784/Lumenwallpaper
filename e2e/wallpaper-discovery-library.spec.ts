import { expect, test } from "@playwright/test";

type WallpaperApiItem = {
  id: string;
  slug: string;
  title: string;
};

type SimilarWallpaperGroup = {
  kind: "color" | "creator" | "ratio" | "style";
  label: string;
  wallpapers: WallpaperApiItem[];
};

type WallpaperDevicePreset = {
  height: number;
  id: string;
  label: string;
  platform: string;
  ratio: string;
  width: number;
};

test.describe("壁纸发现与收藏 API", () => {
  test("详情页可拉取相似壁纸分组", async ({ request }) => {
    const seedResponse = await request.get("/api/wallpapers?limit=1");
    expect(seedResponse.ok()).toBe(true);

    const seedPayload = (await seedResponse.json()) as {
      data: WallpaperApiItem[];
    };
    const seed = seedPayload.data[0];

    test.skip(!seed, "当前环境没有公开壁纸，跳过相似推荐断言");

    const response = await request.get(
      `/api/wallpapers/${encodeURIComponent(seed.slug)}/similar?limit=4`,
    );

    expect(response.ok()).toBe(true);

    const payload = (await response.json()) as {
      data: {
        groups: SimilarWallpaperGroup[];
        source: WallpaperApiItem;
      };
    };

    expect(payload.data.source.slug).toBe(seed.slug);

    for (const group of payload.data.groups) {
      expect(["color", "creator", "ratio", "style"]).toContain(group.kind);
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.wallpapers.length).toBeLessThanOrEqual(4);
      expect(
        group.wallpapers.every((wallpaper) => wallpaper.slug !== seed.slug),
      ).toBe(true);
    }
  });

  test("下载预设返回常见设备分组", async ({ request }) => {
    const response = await request.get("/api/wallpapers/download-presets");

    expect(response.ok()).toBe(true);

    const payload = (await response.json()) as {
      data: {
        groups: Array<{
          label: string;
          platform: string;
          presets: WallpaperDevicePreset[];
        }>;
      };
    };
    const platforms = payload.data.groups.map((group) => group.platform);

    expect(platforms).toEqual(
      expect.arrayContaining(["android", "ipad", "iphone", "mac", "windows"]),
    );

    for (const group of payload.data.groups) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.presets.length).toBeGreaterThan(0);

      for (const preset of group.presets) {
        expect(preset.id.length).toBeGreaterThan(0);
        expect(preset.width).toBeGreaterThan(0);
        expect(preset.height).toBeGreaterThan(0);
        expect(preset.ratio.length).toBeGreaterThan(0);
      }
    }
  });

  test("合集 API 未登录时返回结构化鉴权错误", async ({ request }) => {
    const response = await request.get("/api/library/collections");

    expect([401, 503]).toContain(response.status());

    const payload = (await response.json()) as {
      code: string;
      error: string;
    };

    expect(["AUTH_REQUIRED", "AUTH_NOT_CONFIGURED"]).toContain(payload.code);
    expect(payload.error.length).toBeGreaterThan(0);
  });
});
