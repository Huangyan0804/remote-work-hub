import { NextResponse } from "next/server";
import { openSession, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const cookies = req.headers.get("cookie") ?? "";
  const raw = cookies
    .split("; ")
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  const session = await openSession(raw);

  // 通知后端吊销（真登出，不只是删本地 cookie）
  if (session) {
    await fetch(`${process.env.API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
  }

  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
