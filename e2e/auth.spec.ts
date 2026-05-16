import { expect, test } from "@playwright/test";

// E2E-01: 用户完整 Magic Link 登录链路
test.describe("Magic Link 登录", () => {
  test("登录页渲染正确，可输入邮箱并提交", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h1, h2").first()).toBeVisible();
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    await emailInput.fill(`login-${Date.now()}@example.com`);
    await emailInput.press("Enter");

    await expect(
      page.locator("text=/调试链接|已发|sent|check|检查/i").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("开发环境可完成 Magic Link 验证并建立会话", async ({ page }) => {
    const email = `dev-login-${Date.now()}@example.com`;
    const response = await page.request.post("/api/email/send", {
      data: {
        email,
        redirectTo: "/library",
      },
    });

    test.skip(
      response.status() === 503,
      "当前环境未配置认证，且未启用开发环境登录 fallback。",
    );

    expect(response.ok()).toBe(true);
    const payload = (await response.json()) as {
      data?: {
        devMagicLink?: string;
      };
    };
    const devMagicLink = payload.data?.devMagicLink;

    if (!devMagicLink) {
      test.skip(
        true,
        "当前环境通过真实邮件发送 Magic Link，无法在 E2E 中读取邮件链接。",
      );
      return;
    }

    await page.goto(devMagicLink);
    await expect(page).toHaveURL(/\/library/, { timeout: 10_000 });

    const sessionResponse = await page.request.get("/api/auth/session");
    expect(sessionResponse.ok()).toBe(true);
    const sessionPayload = (await sessionResponse.json()) as {
      data?: {
        authenticated?: boolean;
        session?: {
          user?: {
            email?: string;
          };
        };
      };
    };

    expect(sessionPayload.data?.authenticated).toBe(true);
    expect(sessionPayload.data?.session?.user?.email).toBe(email);
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
