import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * 路由守卫（src/proxy.ts）的真实浏览器验证。
 * 守卫在 Edge 层用 SESSION_SECRET 解密 rh_session 决定放行，这些分支在 jsdom 单测里跑不到（没有真导航），
 * 只能在真浏览器里走一遍。
 */

const password = "Passw0rd!23";

function uniqueEmail(): string {
  return `e2e-guard-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** 建号并保留会话，模拟"已登录"的浏览器上下文 */
async function signUpAndStay(page: Page): Promise<string> {
  const email = uniqueEmail();
  const created = await page.request.post("/api/auth/register", {
    data: { name: "守卫用户", email, password },
  });
  expect(created.ok()).toBe(true);
  return email;
}

/** 建号后立刻登出，回到未登录态 */
async function signUpThenLogout(page: Page): Promise<string> {
  const email = await signUpAndStay(page);
  await page.request.post("/api/auth/logout");
  return email;
}

test("未登录访问首页重定向到登录页，且不带 redirect（首访不该弹会话失效）", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "欢迎回来" })).toBeVisible();
});

test("未登录访问受保护页带上 redirect，登录后回跳原地址", async ({ page }) => {
  const email = await signUpThenLogout(page);

  await page.goto("/health");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fhealth$/);

  await page.locator("#form-login-email").fill(email);
  await page.locator("#form-login-password").fill(password);
  await page.locator('#form-login button[type="submit"]').click();

  // 回到最初想去的 /health，并且它能拿到数据（说明 BFF 确实带上了 token 转发）
  await expect(page).toHaveURL(/\/health$/);
  await expect(page.getByRole("heading", { name: "健康检查" })).toBeVisible();
  await expect(page.getByText("运行正常")).toBeVisible();
});

test("已登录访问登录页 / 注册页被送回首页", async ({ page }) => {
  await signUpAndStay(page);

  await page.goto("/login");
  await expect(page).toHaveURL("/");

  await page.goto("/register");
  await expect(page).toHaveURL("/");
});

test("伪造的 rh_session 解不开，视作未登录", async ({ page, context }) => {
  await context.addCookies([
    {
      name: "rh_session",
      value: "not-a-real-jwe",
      url: "http://localhost:3000",
    },
  ]);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("redirect 指向站外地址时归一化为首页", async ({ page }) => {
  const email = await signUpThenLogout(page);

  // 三种绕过尝试：绝对地址、协议相对、反斜杠
  for (const raw of ["https://evil.com", "//evil.com", "/\\evil.com"]) {
    await page.goto(`/login?redirect=${encodeURIComponent(raw)}`);
    await page.locator("#form-login-email").fill(email);
    await page.locator("#form-login-password").fill(password);
    await page.locator('#form-login button[type="submit"]').click();

    await expect(page).toHaveURL("/");
    expect(new URL(page.url()).host).toBe("localhost:3000");

    await page.request.post("/api/auth/logout");
  }
});

test("静态资源不被守卫拦截", async ({ page }) => {
  const res = await page.request.get("/next.svg");
  expect(res.status()).toBe(200);
});
