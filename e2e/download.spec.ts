import { expect, test } from "@playwright/test";

// E2E-03: 壁纸浏览与下载（访客可用流程）
test.describe("壁纸浏览与下载", () => {
  test("首页正常加载，包含核心版块", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Hero 区可见
    await expect(page.locator("section").first()).toBeVisible();

    // 页面包含「进入画廊」入口
    const galleryLink = page.locator("a[href='/explore']").first();
    await expect(galleryLink).toBeVisible();
  });

  test("探索页正常加载", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });

  test("壁纸详情页：有效 slug 返回 200", async ({ page }) => {
    // 先从探索页拿一个壁纸链接
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");

    const wallpaperLinks = page.locator("a[href^='/wallpaper/']");
    const count = await wallpaperLinks.count();

    if (count > 0) {
      const href = await wallpaperLinks.first().getAttribute("href");
      if (href) {
        const response = await page.goto(href);
        expect(response?.status()).toBe(200);
        await expect(page.locator("main")).toBeVisible();
      }
    } else {
      // 没有壁纸数据时跳过，仅标记为不可用
      test.skip(true, "探索页暂无壁纸数据，跳过详情页测试");
    }
  });

  test("壁纸详情页：不存在的 id 返回 404 或重定向", async ({ page }) => {
    const response = await page.goto("/wallpaper/non-existent-wallpaper-id-xyz");
    expect([404, 200]).toContain(response?.status());
    // 若是 200 也应该展示错误提示
    if (response?.status() === 200) {
      const body = await page.textContent("body");
      expect(/找不到|not found|404|未找到/i.test(body ?? "")).toBe(true);
    }
  });
});
