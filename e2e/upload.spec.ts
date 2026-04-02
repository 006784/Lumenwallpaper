import { expect, test } from "@playwright/test";

// E2E-02: 上传工作台（需登录，未登录时验证重定向）
test.describe("上传工作台", () => {
  test("未登录访问上传工作台 → 重定向到登录页", async ({ page }) => {
    await page.goto("/creator/studio");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("未登录访问作品管理页 → 重定向到登录页", async ({ page }) => {
    await page.goto("/creator/studio/manage");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("presign API 未携带凭据应返回 401", async ({ page }) => {
    const response = await page.request.post("/api/upload/presign", {
      data: { fileName: "test.jpg", fileType: "image/jpeg", fileSize: 1024 * 100 },
    });
    expect(response.status()).toBe(401);
  });

  test("wallpapers API POST 未携带凭据应返回 401", async ({ page }) => {
    const response = await page.request.post("/api/wallpapers", {
      data: { title: "test" },
    });
    expect(response.status()).toBe(401);
  });
});

// E2E-05: 收藏（需登录）
test.describe("收藏功能（未登录边界）", () => {
  test("favorite API 未携带凭据应返回 401", async ({ page }) => {
    const response = await page.request.post(
      "/api/wallpapers/some-wallpaper-id/favorite",
    );
    expect(response.status()).toBe(401);
  });
});
