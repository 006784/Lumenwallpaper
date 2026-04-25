import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const SMOKE_WALLPAPER_PATH = "/wallpaper/beauty-photo-0112";

async function gotoSmokeWallpaper(page: Page) {
  const response = await page.goto(SMOKE_WALLPAPER_PATH, {
    waitUntil: "domcontentloaded",
  });

  if (response?.status() === 404) {
    test.skip(true, "生产环境缺少固定 smoke 壁纸，跳过下载面板测试");
  }

  await expect(page.locator("main")).toBeVisible();

  return {
    identifier: SMOKE_WALLPAPER_PATH.split("/").pop() ?? "beauty-photo-0112",
    response,
  };
}

// E2E-03: 壁纸浏览与下载（访客可用流程）
test.describe("壁纸浏览与下载", () => {
  test.describe.configure({ mode: "serial" });

  test("首页正常加载，包含核心版块", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Hero 区可见
    await expect(page.locator("section").first()).toBeVisible();

    // 页面包含「进入画廊」入口
    const galleryLink = page.locator("a[href='/explore']:visible").first();
    await expect(galleryLink).toBeVisible();
  });

  test("探索页正常加载", async ({ page }) => {
    await page.goto("/explore", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
  });

  test("壁纸详情页：有效 slug 返回 200", async ({ page }) => {
    const { response } = await gotoSmokeWallpaper(page);
    expect(response?.status()).toBe(200);
  });

  test("壁纸详情页：不存在的 id 返回 404 或重定向", async ({ page }) => {
    const response = await page.goto(
      "/wallpaper/non-existent-wallpaper-id-xyz",
    );
    expect([404, 200]).toContain(response?.status());
    // 若是 200 也应该展示错误提示
    if (response?.status() === 200) {
      const body = await page.textContent("body");
      expect(/找不到|not found|404|未找到/i.test(body ?? "")).toBe(true);
    }
  });

  test("壁纸详情页：下载面板可打开并切换格式与比例", async ({ page }) => {
    await gotoSmokeWallpaper(page);

    const openDownloadButton = page
      .getByRole("button", { name: "打开下载配置" })
      .first();
    await expect(openDownloadButton).toHaveAttribute(
      "data-download-ready",
      "true",
    );
    await openDownloadButton.click();

    await expect(page.getByText("DARKROOM EXPORT")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "下载配置" }),
    ).toBeVisible();

    const webpButton = page.getByRole("button", { name: "WebP" });
    await webpButton.click();
    await expect(page.getByText("WebP 压缩")).toBeVisible();

    const ratioButton = page.getByRole("button", { name: "9:16" }).first();
    await ratioButton.click();

    const webpBackground = await webpButton.evaluate((node) => {
      return window.getComputedStyle(node).backgroundColor;
    });
    const ratioBackground = await ratioButton.evaluate((node) => {
      return window.getComputedStyle(node).backgroundColor;
    });

    expect(webpBackground).toBe("rgb(10, 8, 4)");
    expect(ratioBackground).toBe("rgb(212, 43, 43)");
    await expect(page.getByText("下载壁纸")).toBeVisible();
  });

  test("下载接口：无效配置返回结构化错误", async ({ page }) => {
    const { identifier } = await gotoSmokeWallpaper(page);
    const response = await page.request.get(
      `/api/wallpapers/${identifier}/download?format=gif`,
    );
    const payload = (await response.json()) as {
      code?: string;
      error?: string;
      status?: number;
    };

    expect(response.status()).toBe(400);
    expect(payload).toMatchObject({
      code: "INVALID_WALLPAPER_DOWNLOAD_QUERY",
      status: 400,
    });
  });

  test("下载接口：格式和裁切配置返回转换文件", async ({ page }) => {
    const { identifier } = await gotoSmokeWallpaper(page);
    const response = await page.request.get(
      `/api/wallpapers/${identifier}/download?format=webp&ratio=1%3A1&resolution=320%20%C3%97%20320`,
    );

    test.skip(
      [404, 503].includes(response.status()),
      "当前环境缺少下载源文件或 R2 配置，跳过转换链路测试",
    );

    expect(response.ok()).toBe(true);

    const headers = response.headers();
    expect(headers["content-type"]).toContain("image/webp");
    expect(headers["content-disposition"]).toContain(".webp");
    expect(headers["x-wallpaper-download-format"]).toBe("webp");
    expect(headers["x-wallpaper-download-ratio"]).toBe("1:1");
    expect(headers["x-wallpaper-download-resolution"]).toBe("320x320");
    expect(headers["x-wallpaper-transformed"]).toBe("true");

    const body = await response.body();
    expect(body.length).toBeGreaterThan(100);
  });

  test("壁纸详情页：缓存配置后再次打开会自动恢复", async ({ page }) => {
    const { identifier } = await gotoSmokeWallpaper(page);

    if (identifier) {
      await page.evaluate((storageKey) => {
        window.localStorage.removeItem(storageKey);
      }, `lumen:download-config:${identifier}`);
    }

    const openDownloadButton = page
      .getByRole("button", { name: "打开下载配置" })
      .first();
    await expect(openDownloadButton).toHaveAttribute(
      "data-download-ready",
      "true",
    );
    await openDownloadButton.click();

    const webpButton = page.getByRole("button", { name: "WebP" });
    const ratioButton = page.getByRole("button", { name: "9:16" }).first();

    await webpButton.click();
    await ratioButton.click();
    await page.getByRole("button", { name: "缓存配置" }).click();
    await expect(page.getByRole("button", { name: "已缓存 ✓" })).toBeVisible();

    await page.locator("button").filter({ hasText: "✕" }).first().click();
    await expect(page.getByText("DARKROOM EXPORT")).not.toBeVisible();

    await expect(openDownloadButton).toHaveAttribute(
      "data-download-ready",
      "true",
    );
    await openDownloadButton.click();
    await expect(page.getByText("DARKROOM EXPORT")).toBeVisible();

    await expect
      .poll(async () => {
        return webpButton.evaluate((node) => {
          return window.getComputedStyle(node).backgroundColor;
        });
      })
      .toBe("rgb(10, 8, 4)");
    await expect
      .poll(async () => {
        return ratioButton.evaluate((node) => {
          return window.getComputedStyle(node).backgroundColor;
        });
      })
      .toBe("rgb(212, 43, 43)");
  });
});
