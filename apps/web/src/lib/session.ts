import { EncryptJWT, jwtDecrypt } from "jose";

export const SESSION_COOKIE = "rh_session";

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret) {
  throw new Error("SESSION_SECRET 未配置（apps/web/.env.local）");
}

// alg=dir + enc=A256GCM 要求密钥正好 32 字节，长度不对现在就炸，别等第一次登录
const key = decodeBase64(rawSecret);
if (key.length !== 32) {
  throw new Error(`SESSION_SECRET 解码后应为 32 字节，实际 ${key.length} 字节`);
}

export interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  /** 决定 cookie 是持久还是会话级（= 记住我） */
  remember: boolean;
}

/** 用 AES-256-GCM 加密成 JWE。httpOnly 已经挡住 JS，加密是纵深防御 */
export async function sealSession(payload: SessionPayload): Promise<string> {
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(payload.remember ? "30d" : "1d")
    .encrypt(key);
}

export async function openSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, key);
    return {
      accessToken: payload.accessToken as string,
      refreshToken: payload.refreshToken as string,
      remember: Boolean(payload.remember),
    };
  } catch {
    return null; // 解不开 = 无效，当作未登录
  }
}

/** cookie 属性集中在这里，登录和刷新共用 */
export function sessionCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    // 关键：勾了才有 Max-Age。没勾就是会话 cookie，关浏览器即丢
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  };
}
