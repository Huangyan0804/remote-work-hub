import type { LoginRequest } from "@repo/types";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  sealSession,
  sessionCookieOptions,
} from "@/lib/session";

export async function POST(req: Request) {
  const body = (await req.json()) as LoginRequest;

  const upstream = await fetch(
    `${process.env.API_BASE_URL}/api/auth/register`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = await upstream.json();

  // 失败原样透传（错误码/文案体系保持不变）
  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  // 成功：token 关进 cookie，只把 user 给浏览器
  const res = NextResponse.json({ user: data.user });
  const remember = body.rememberMe ?? false;

  res.cookies.set(
    SESSION_COOKIE,
    await sealSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      remember,
    }),
    sessionCookieOptions(remember),
  );

  return res;
}
