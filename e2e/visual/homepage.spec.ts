import { expect, test } from "@playwright/test";

// 等待 Lenis + GSAP 动画完成后再截图的公共辅助
async function waitForAnimations(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  // 等待 GSAP 入场动画完成（最长 1.5s）
  await page.waitForTimeout(1500);
}

// ─── 首页整体 ──────────────────────────────────────────────

test.describe("VR 首页视觉回归", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAnimations(page);
  });

  // VR-01: 英雄区 — 桌面端（初始加载）
  test("VR-01 Hero 桌面端", async ({ page }) => {
    await expect(page.locator("section").first()).toHaveScreenshot(
      "VR-01-hero-desktop.png",
    );
  });

  // VR-02: 英雄区 — 胶卷格 hover 展开
  test("VR-02 Hero FilmCell hover", async ({ page }) => {
    const filmCells = page.locator("section").first().locator(".group");
    if ((await filmCells.count()) > 0) {
      await filmCells.nth(1).hover();
      await page.waitForTimeout(600);
    }
    await expect(page.locator("section").first().locator(".flex.flex-col").first()).toHaveScreenshot(
      "VR-02-film-cell-hover.png",
    );
  });

  // VR-03: 情绪版 — 卡片默认态（一排完整）
  test("VR-03 MoodBoard 默认态", async ({ page }) => {
    const moodSection = page.locator("section").nth(2);
    await moodSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await expect(moodSection).toHaveScreenshot("VR-03-mood-board-default.png");
  });

  // VR-04: 情绪版 — Portrait 卡片 hover（信息滑入）
  test("VR-04 MoodCard hover 信息出现", async ({ page }) => {
    const moodSection = page.locator("section").nth(2);
    await moodSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);

    const firstCard = moodSection.locator("a.group").first();
    await firstCard.hover();
    await page.waitForTimeout(500);
    await expect(firstCard).toHaveScreenshot("VR-04-mood-card-hover.png");
  });

  // VR-10: Ticker 完整展示
  test("VR-10 Ticker 展示", async ({ page }) => {
    const ticker = page.locator("section").nth(1);
    await ticker.scrollIntoViewIfNeeded();
    await expect(ticker).toHaveScreenshot("VR-10-ticker.png");
  });

  // VR-11: Nav 默认态（桌面）
  test("VR-11 Nav 默认态", async ({ page }) => {
    await expect(page.locator("header")).toHaveScreenshot("VR-11-nav-default.png");
  });

  // VR-12: Nav 滚动后状态
  test("VR-12 Nav 滚动后", async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(400);
    await expect(page.locator("header")).toHaveScreenshot("VR-12-nav-scrolled.png");
  });
});

// ─── 分类栏 ──────────────────────────────────────────────

test.describe("VR 分类栏", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAnimations(page);
  });

  // VR-05: 分类栏 — 第 3 格展开态
  test("VR-05 CategoryStrip 第3格展开", async ({ page }) => {
    const catStrip = page.locator("section:has(.group)").filter({
      has: page.locator('[style*="writing-mode"]'),
    }).first();

    await catStrip.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);

    const catBlocks = catStrip.locator("a.group");
    if ((await catBlocks.count()) > 2) {
      await catBlocks.nth(2).hover();
      await page.waitForTimeout(700);
    }

    await expect(catStrip).toHaveScreenshot("VR-05-category-expanded.png");
  });
});

// ─── 编辑精选 ─────────────────────────────────────────────

test.describe("VR 编辑精选", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAnimations(page);
  });

  // VR-06: 编辑精选 — 主图 hover（背景缩放）
  test("VR-06 Editorial 主图 hover", async ({ page }) => {
    // Editorial section 是分类栏之后的 section
    const sections = page.locator("section");
    const count = await sections.count();

    // 找包含 md:grid-cols 的编辑区
    let editorialSection = null;
    for (let i = 0; i < count; i++) {
      const cls = await sections.nth(i).getAttribute("class");
      if (cls?.includes("border-b-frame")) {
        editorialSection = sections.nth(i);
      }
    }

    if (editorialSection) {
      await editorialSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      const mainLink = editorialSection.locator("a.group").first();
      await mainLink.hover();
      await page.waitForTimeout(800);
      await expect(editorialSection).toHaveScreenshot("VR-06-editorial-hover.png");
    } else {
      test.skip(true, "未找到 editorial section");
    }
  });
});

// ─── 暗室精选 ─────────────────────────────────────────────

test.describe("VR 暗室精选", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAnimations(page);
  });

  // VR-07: 暗室区 — 整体（桌面）
  test("VR-07 暗室整体 桌面", async ({ page }) => {
    const darkroom = page.locator("section.bg-ink").first();
    await darkroom.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await expect(darkroom).toHaveScreenshot("VR-07-darkroom-desktop.png");
  });

  // VR-08: 暗室区 — 大格 hover（信息出现）
  test("VR-08 暗室大格 hover", async ({ page }) => {
    const darkroom = page.locator("section.bg-ink").first();
    await darkroom.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);

    const featuredCard = darkroom.locator("a.group").first();
    await featuredCard.hover();
    await page.waitForTimeout(400);
    await expect(featuredCard).toHaveScreenshot("VR-08-darkroom-hover.png");
  });
});

// ─── Join / 搜索区 ────────────────────────────────────────

test.describe("VR Join & 搜索", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAnimations(page);
  });

  // VR-09: Join 区 — 上传区 hover（+ 旋转变色）
  test("VR-09 Join 上传区 hover", async ({ page }) => {
    const joinSection = page.locator("section:has([class*='rotate-45'])").first();
    if ((await joinSection.count()) > 0) {
      await joinSection.scrollIntoViewIfNeeded();
      const uploadBox = joinSection.locator(".group").last();
      await uploadBox.hover();
      await page.waitForTimeout(400);
      await expect(uploadBox).toHaveScreenshot("VR-09-join-hover.png");
    } else {
      // Fallback：截图整个 join section 区域
      const sections = page.locator("section");
      const last = sections.last();
      await last.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await expect(last).toHaveScreenshot("VR-09-join-section.png");
    }
  });

  // VR-13: 搜索区 — 标签激活态
  test("VR-13 搜索区 标签激活", async ({ page }) => {
    const searchSection = page.locator('section:has(input[name="q"])').first();
    await searchSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const tags = searchSection.locator('button[type="button"]');
    if ((await tags.count()) > 1) {
      await tags.nth(1).click();
      await page.waitForTimeout(200);
    }

    await expect(searchSection).toHaveScreenshot("VR-13-search-tag-active.png");
  });

  // VR-14: Footer 完整布局（桌面）
  test("VR-14 Footer 桌面", async ({ page }) => {
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(page.locator("footer")).toHaveScreenshot("VR-14-footer-desktop.png");
  });

  // VR-15: 噪点纹理 — 覆盖全页
  test("VR-15 噪点纹理全页", async ({ page }) => {
    // 截取整页（含噪点 ::after 伪元素）
    await expect(page).toHaveScreenshot("VR-15-full-page-grain.png", {
      fullPage: true,
      maxDiffPixels: 300, // 噪点随机，允许较大容差
    });
  });
});

// ─── 移动端（iPhone 14） ──────────────────────────────────

test.describe("VR Hero 移动端", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // VR-01 mobile
  test("VR-01 Hero 移动端", async ({ page }) => {
    await page.goto("/");
    await waitForAnimations(page);
    await expect(page.locator("section").first()).toHaveScreenshot(
      "VR-01-hero-mobile.png",
    );
  });

  // VR-07 mobile
  test("VR-07 暗室整体 移动端", async ({ page }) => {
    await page.goto("/");
    await waitForAnimations(page);
    const darkroom = page.locator("section.bg-ink").first();
    await darkroom.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(darkroom).toHaveScreenshot("VR-07-darkroom-mobile.png");
  });

  // VR-11 mobile
  test("VR-11 Nav 移动端", async ({ page }) => {
    await page.goto("/");
    await waitForAnimations(page);
    await expect(page.locator("header")).toHaveScreenshot("VR-11-nav-mobile.png");
  });

  // VR-13 mobile
  test("VR-13 搜索区 移动端", async ({ page }) => {
    await page.goto("/");
    await waitForAnimations(page);
    const searchSection = page.locator('section:has(input[name="q"])').first();
    await searchSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(searchSection).toHaveScreenshot("VR-13-search-mobile.png");
  });

  // VR-14 mobile
  test("VR-14 Footer 移动端", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(page.locator("footer")).toHaveScreenshot("VR-14-footer-mobile.png");
  });
});
