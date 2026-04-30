import { expect, test } from "@playwright/test";

test.describe("INS Picks 专区", () => {
  test("公开 API 返回人物合集和统一上传入口", async ({ request }) => {
    const response = await request.get("/api/ins-picks");

    expect(response.ok()).toBe(true);

    const payload = (await response.json()) as {
      data: {
        collections: Array<{
          count: number;
          href: string;
          label: string;
          requiredTags: string[];
          slug: string;
        }>;
        upload: {
          href: string;
          requiredTags: string[];
        };
      };
    };

    expect(payload.data.upload.href).toBe("/creator/studio");
    expect(payload.data.upload.requiredTags).toEqual(
      expect.arrayContaining(["ins", "instagram", "celebrity"]),
    );
    expect(payload.data.collections.map((collection) => collection.slug)).toEqual(
      expect.arrayContaining(["iu", "lim-yoona", "jang-wonyoung", "liu-yifei"]),
    );

    for (const collection of payload.data.collections) {
      expect(collection.count).toBeGreaterThanOrEqual(0);
      expect(collection.href).toBe(`/ins/${collection.slug}`);
      expect(collection.requiredTags.length).toBeGreaterThan(0);
    }
  });

  test("公开页面展示合集、上传入口和空态导入说明", async ({ page }) => {
    await page.goto("/ins");

    await expect(
      page.getByRole("heading", { name: /Instagram muse archive/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Jang Wonyoung/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /IU \/ Instagram archive/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Lim Yoona/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Upload photos/i })).toBeVisible();
  });

  test("人物合集页面可直接打开", async ({ page }) => {
    await page.goto("/ins/iu");

    await expect(
      page.getByRole("heading", { level: 1, name: /^IU$/i }),
    ).toBeVisible();
    await expect(page.getByText("IU / Instagram archive")).toBeVisible();
    await expect(page.getByRole("link", { name: /All collections/i })).toBeVisible();
  });
});
