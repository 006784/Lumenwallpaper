import { expect, test } from "@playwright/test";

test.describe("多语言 UI", () => {
  test("首页未指定 locale 时默认显示英文", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /Every frame deserves to be seen/i,
      }),
    ).toBeVisible();
  });

  test("首页可通过 locale 参数显示英语、日语、韩语主文案", async ({ page }) => {
    await page.goto("/?locale=en");
    await expect(
      page.getByRole("heading", {
        name: /Every frame deserves to be seen/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Explore" }).first(),
    ).toBeVisible();

    await page.goto("/?locale=ja");
    await expect(
      page.getByRole("heading", {
        name: /すべてのフレームは、 見られる価値がある。/,
      }),
    ).toBeVisible();

    await page.goto("/?locale=ko");
    await expect(
      page.getByRole("heading", {
        name: /모든 프레임은 보여질 가치가 있습니다./,
      }),
    ).toBeVisible();
  });

  test("语言切换器会刷新当前页面并写入 locale 参数", async ({ page }) => {
    await page.goto("/?locale=zh-CN");

    await page.locator("#lumen-language-switcher").selectOption("en");
    await page.waitForURL(/locale=en/);

    await expect(
      page.getByRole("heading", {
        name: /Every frame deserves to be seen/i,
      }),
    ).toBeVisible();
  });
});
