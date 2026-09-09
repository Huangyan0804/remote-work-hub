import { expect, test } from "@playwright/test";

test("首页经真实链路展示后端健康状态，且可手动刷新", async ({ page }) => {
  const healthRequests: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/health")) healthRequests.push(req.url());
  });

  await page.goto("/");

  // 浏览器里真实渲染出的三处状态
  await expect(page.getByText("status: ok")).toBeVisible();
  await expect(page.getByText("db: connected")).toBeVisible();
  // userCount 是动态值 → 用正则断言"格式"而非具体数字（呼应踩坑#8）
  await expect(page.getByText(/当前用户数：\d+/)).toBeVisible();

  // 点"重新检查"应发出第二次 /api/health 请求
  await page.getByRole("button", { name: "重新检查" }).click();
  await expect(page.getByText("status: ok")).toBeVisible();
  expect(healthRequests.length).toBeGreaterThanOrEqual(2);
});
