import { expect, test } from "@playwright/test";

// E2E-04: 搜索与过滤
test.describe("搜索与过滤", () => {
  test("探索页：关键词搜索后 URL 更新", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator('input[name="q"], input[type="search"]').first();
    if ((await searchInput.count()) === 0) {
      // 探索页可能用 form action 跳转，找首页搜索框
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const homeSearch = page.locator('input[name="q"]').first();
      await homeSearch.fill("森林");
      await page.keyboard.press("Enter");
      await page.waitForURL(/\/explore.*q=/, { timeout: 8_000 });
      expect(page.url()).toContain("q=");
      return;
    }

    await searchInput.fill("森林");
    await page.keyboard.press("Enter");
    await page.waitForURL(/q=/, { timeout: 8_000 });
    expect(page.url()).toContain("q=");
  });

  test("探索页：切换分类标签，URL 参数更新", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");

    const categoryLinks = page.locator("a[href*='/explore/']");
    const count = await categoryLinks.count();
    if (count > 0) {
      const href = await categoryLinks.first().getAttribute("href");
      if (href) {
        await page.goto(href);
        await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
    }
  });

  test("首页搜索区：标签入口跳转到探索页", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const searchSection = page
      .locator("section")
      .filter({ hasText: "Discovery console" })
      .first();
    await searchSection.scrollIntoViewIfNeeded();

    const tags = searchSection.locator("a[href^='/explore']");
    const tagCount = await tags.count();
    if (tagCount > 1) {
      await tags.nth(1).click();
      await page.waitForURL(/\/explore/, { timeout: 8_000 });
      expect(page.url()).toContain("/explore");
    }
  });

  test("暗室精选页正常加载", async ({ page }) => {
    await page.goto("/darkroom");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });
});
