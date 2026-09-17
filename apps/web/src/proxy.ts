import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createProxy } from "next-i18next/proxy";
import i18nConfig from "../i18n.config";
import { openSession, SESSION_COOKIE } from "./lib/session";

const i18nProxy = createProxy(i18nConfig);

/** 未登录也能访问的页面，以后加「忘记密码」之类的记得同步 */
const PUBLIC_PATHS = new Set(["/login", "/register"]);
/** /next.svg、/favicon.ico 这类静态文件放行（matcher 排不干净） */
const STATIC_FILE = /\.[a-z0-9]+$/i;

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!STATIC_FILE.test(pathname)) {
    // 必须真的解密，不能只看 cookie 存在 —— 否则伪造一个 rh_session 就能绕过
    const session = await openSession(req.cookies.get(SESSION_COOKIE)?.value);

    // 未登录访问受保护页面 → 登录页，带上回跳地址
    if (!session && !isPublic) {
      const url = new URL("/login", req.url);
      const target = pathname + search;
      // 从 "/" 进来不带 redirect：登录页看到 ?redirect= 会弹「会话已失效」，首访用户不该看到
      if (target !== "/") url.searchParams.set("redirect", target);
      return NextResponse.redirect(url);
    }

    // 已登录还去登录/注册页 → 回首页
    if (session && isPublic) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 走到这里说明放行，语言检测照旧
  return i18nProxy(req);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|site.webmanifest).*)",
  ],
};
