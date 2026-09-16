import type { APIError } from "@repo/types";
import { NextResponse } from "next/server";
import type { SessionPayload } from "@/lib/session";
import {
  openSession,
  SESSION_COOKIE,
  sealSession,
  sessionCookieOptions,
} from "@/lib/session";

const API_BASE_URL = process.env.API_BASE_URL;

type Ctx = { params: Promise<{ path: string[] }> };

/** 带 access token 转发一次 */
async function forward(req: Request, url: string, accessToken: string) {
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return fetch(url, {
    method: req.method,
    headers: {
      "content-type": req.headers.get("content-type") ?? "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: hasBody ? await req.text() : undefined,
  });
}

/** 用 refresh token 换新的一对 */
async function tryRefresh(
  refreshToken: string,
): Promise<SessionPayload | null> {
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;

  const data = await res.json();
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    remember: false, // 占位，真实值下面覆盖
  };
}

function sessionExpired(req: Request): NextResponse {
  return NextResponse.json(
    {
      statusCode: 401,
      code: "AUTH_UNAUTHORIZED",
      message: "AUTH_UNAUTHORIZED",
      path: new URL(req.url).pathname,
      timestamp: new Date().toISOString(),
    } satisfies APIError,
    { status: 401 },
  );
}

async function handler(req: Request, ctx: Ctx) {
  // ① CSRF 兜底：Origin 必须是自己。Next.js 的 Server Actions 自带这层，Route Handler 没有
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // ② 取 session
  const raw = (req.headers.get("cookie") ?? "")
    .split("; ")
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  const session = await openSession(raw);
  if (!session) {
    return sessionExpired(req);
  }

  // ③ 转发
  const { path } = await ctx.params;
  const url = `${API_BASE_URL}/api/${path.join("/")}${new URL(req.url).search}`;

  let upstream = await forward(req, url, session.accessToken);

  // ④ access 过期 → 刷新 → 重放原请求
  let updated: SessionPayload | null = null;
  if (upstream.status === 401) {
    const refreshed = await tryRefresh(session.refreshToken);

    if (!refreshed) {
      // refresh 也失效了，清 cookie 让前端跳登录页
      const res = sessionExpired(req);
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }

    updated = { ...refreshed, remember: session.remember }; // 继承记住我标记
    upstream = await forward(req, url, updated.accessToken);
  }

  // ⑤ 回传给浏览器
  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });

  // 刷过 token 就重写 cookie（浏览器无感）
  if (updated) {
    res.cookies.set(
      SESSION_COOKIE,
      await sealSession(updated),
      sessionCookieOptions(updated.remember),
    );
  }

  return res;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
