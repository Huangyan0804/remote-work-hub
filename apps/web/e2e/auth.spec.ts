import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * 认证真链路：走真实 Next.js（BFF）+ NestJS + PostgreSQL，不打任何 mock。
 * 数据库在远程（见 apps/api/.env 的 DATABASE_URL），本地只要 api/web 两个服务在线即可
 * —— playwright.config 的 webServer 会自动拉起来。
 */

const password = "Passw0rd!23";

/** 每次跑都用新邮箱，避免"邮箱已存在"污染后续用例 */
function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * 勾选条款/记住我。
 * base-ui 的 Checkbox 会额外渲染一个 aria-hidden 的隐藏 input（它身上才带 id），
 * 直接点 #policy / #remember 会落到那个不可见元素上，所以按角色找可见的那个。
 */
function checkbox(page: Page, name: RegExp | string) {
  return page.getByRole("checkbox", { name });
}

/**
 * 用接口快速建号（注册 UI 已由上面用例单独覆盖，这里只是造数据）。
 * 建完立刻登出 —— 否则浏览器上下文里留着会话，proxy 会把 /login、/register 直接重定向走。
 */
async function createAccount(page: Page, email: string): Promise<void> {
  const created = await page.request.post("/api/auth/register", {
    data: { name: "端到端用户", email, password },
  });
  expect(created.ok()).toBe(true);

  const loggedOut = await page.request.post("/api/auth/logout");
  expect(loggedOut.status()).toBe(204);
}

async function fillLogin(page: Page, email: string, value: string) {
  await page.locator("#form-login-email").fill(email);
  await page.locator("#form-login-password").fill(value);
  await page.locator('#form-login button[type="submit"]').click();
}

test("注册全流程：填完表单勾选条款 → 落首页，刷新后仍保持登录", async ({
  page,
  context,
}) => {
  const email = uniqueEmail();

  await page.goto("/register");
  await page.locator("#form-register-name").fill("端到端用户");
  await page.locator("#form-register-email").fill(email);
  await page.locator("#form-register-password").fill(password);
  await page.locator("#form-register-confirm-password").fill(password);
  await checkbox(page, /我已阅读并同意/).click();
  await page.locator('#form-register button[type="submit"]').click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("status: ok")).toBeVisible();

  // token 只存在于 httpOnly cookie，浏览器脚本拿不到
  const cookie = (await context.cookies()).find((c) => c.name === "rh_session");
  expect(cookie?.httpOnly).toBe(true);

  // 刷新要能活着回来 = proxy 真的用 SESSION_SECRET 解开了 cookie
  await page.reload();
  await expect(page).toHaveURL("/");
  await expect(page.getByText("status: ok")).toBeVisible();
});

test("登录 → 刷新保持 → 退出后访问受保护页被重定向回登录页", async ({
  page,
  context,
}) => {
  const email = uniqueEmail();
  await createAccount(page, email);

  await page.goto("/login");
  await fillLogin(page, email, password);
  await expect(page).toHaveURL("/");

  // 刷新保持登录
  await page.reload();
  await expect(page).toHaveURL("/");

  // 当前还没有登出按钮，先直接打 BFF 端点 —— 等价于未来那个按钮要发的请求
  const loggedOut = await page.request.post("/api/auth/logout");
  expect(loggedOut.status()).toBe(204);
  expect(
    (await context.cookies()).find((c) => c.name === "rh_session"),
  ).toBeUndefined();

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("勾选记住我时下发持久 cookie，不勾则是会话 cookie", async ({
  page,
  context,
}) => {
  const email = uniqueEmail();
  await createAccount(page, email);
  const sessionCookie = async () =>
    (await context.cookies()).find((c) => c.name === "rh_session");

  // 不勾：会话 cookie，Playwright 用 expires = -1 表示
  await page.goto("/login");
  await fillLogin(page, email, password);
  await expect(page).toHaveURL("/");
  expect((await sessionCookie())?.expires).toBe(-1);

  // 勾上"记住我"再来一次
  await page.request.post("/api/auth/logout");
  await page.goto("/login");
  await page.locator("#form-login-email").fill(email);
  await page.locator("#form-login-password").fill(password);
  await checkbox(page, "记住我").click();
  await page.locator('#form-login button[type="submit"]').click();
  await expect(page).toHaveURL("/");

  expect((await sessionCookie())?.expires).toBeGreaterThan(Date.now() / 1000);
});

test("密码错误时展示错误码对应文案，且停在登录页", async ({ page }) => {
  const email = uniqueEmail();
  await createAccount(page, email);

  await page.goto("/login");
  await fillLogin(page, email, "WrongPass999");

  await expect(page.getByText("邮箱或密码错误")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("邮箱已被注册时展示对应文案", async ({ page }) => {
  const email = uniqueEmail();
  await createAccount(page, email);

  await page.goto("/register");
  await page.locator("#form-register-name").fill("端到端用户");
  await page.locator("#form-register-email").fill(email);
  await page.locator("#form-register-password").fill(password);
  await page.locator("#form-register-confirm-password").fill(password);
  await checkbox(page, /我已阅读并同意/).click();
  await page.locator('#form-register button[type="submit"]').click();

  await expect(page.getByText("该邮箱已被注册")).toBeVisible();
  await expect(page).toHaveURL(/\/register/);
});
