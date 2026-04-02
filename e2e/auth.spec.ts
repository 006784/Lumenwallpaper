import { expect, test } from "@playwright/test";

// E2E-01: 用户完整 Magic Link 登录链路
test.describe("Magic Link 登录", () => {
  test("登录页渲染正确，可输入邮箱并提交", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h1, h2").first()).toBeVisible();
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    await emailInput.fill("test@example.com");
    await emailInput.press("Enter");

    // 提交后应显示「邮件已发送」之类的提示，或跳转到提示页
    await expect(
      page.locator("text=/发送|已发|sent|check/i").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("带无效 token 访问 verify 页面，应展示错误状态", async ({ page }) => {
    await page.goto("/verify?token=invalid-token-for-testing");

    // 应展示错误提示或跳回登录
    await expect(page).toHaveURL(/\/(verify|login)/, { timeout: 8_000 });
    const pageText = await page.textContent("body");
    const hasError = /无效|过期|失败|错误|invalid|expired|error/i.test(
      pageText ?? "",
    );
    const redirectedToLogin = page.url().includes("/login");
    expect(hasError || redirectedToLogin).toBe(true);
  });

  test("未登录时访问个人库应重定向到登录", async ({ page }) => {
    await page.goto("/library");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("未登录时访问创作者工作台应重定向到登录", async ({ page }) => {
    await page.goto("/creator/studio");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});
