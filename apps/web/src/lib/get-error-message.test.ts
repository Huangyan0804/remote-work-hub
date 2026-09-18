import type { TFunction } from "i18next";
import { describe, expect, it, vi } from "vitest";
import { getErrorMessage } from "@/lib/get-error-message";

// 模拟 i18next 的真实契约：查到就返回文案，查不到就返回 defaultValue。
// 这点很关键 —— 函数靠 defaultValue: "" 判断"翻到没翻到"。
const dictionary: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: "邮箱或密码错误",
  CLIENT_UNKNOWN_ERROR: "发生未知错误，请稍后重试",
  CLIENT_NETWORK_ERROR: "网络连接异常，请检查网络后重试",
};

function makeT() {
  return vi.fn(
    (key: string, options?: { defaultValue?: string }) =>
      dictionary[key] ?? options?.defaultValue ?? key,
  );
}

/** axios.isAxiosError 判定的是 isAxiosError 标记，所以可以直接构造最小对象 */
function axiosResponseError(data: unknown) {
  return { isAxiosError: true, response: { data } };
}

function backendError(code: string, message?: string) {
  return {
    statusCode: 401,
    code,
    message,
    path: "/auth/login",
    timestamp: "",
  };
}

describe("getErrorMessage", () => {
  it("认得错误码时返回对应文案", () => {
    const t = makeT();

    const result = getErrorMessage(
      axiosResponseError(backendError("AUTH_INVALID_CREDENTIALS")),
      t as unknown as TFunction,
    );

    expect(result).toBe("邮箱或密码错误");
  });

  it("词典里没有这个码时退回后端的调试描述", () => {
    const t = makeT();

    const result = getErrorMessage(
      axiosResponseError(
        backendError("AUTH_SOMETHING_NEW", "后端还没补文案的新错误"),
      ),
      t as unknown as TFunction,
    );

    expect(result).toBe("后端还没补文案的新错误");
  });

  it("既没翻译也没 message 时用兜底文案", () => {
    const t = makeT();

    expect(
      getErrorMessage(
        axiosResponseError(backendError("AUTH_SOMETHING_NEW")),
        t as unknown as TFunction,
      ),
    ).toBe("发生未知错误，请稍后重试");
  });

  it("响应体不是统一错误结构时用兜底文案", () => {
    const t = makeT();

    expect(
      getErrorMessage(
        axiosResponseError("<html>502 Bad Gateway</html>"),
        t as unknown as TFunction,
      ),
    ).toBe("发生未知错误，请稍后重试");
  });

  it("断网 / 超时（有 axios 错误但没 response）时提示网络异常", () => {
    const t = makeT();

    expect(
      getErrorMessage({ isAxiosError: true }, t as unknown as TFunction),
    ).toBe("网络连接异常，请检查网络后重试");
  });

  it("非 axios 错误时用兜底文案", () => {
    const t = makeT();

    expect(getErrorMessage(new Error("boom"), t as unknown as TFunction)).toBe(
      "发生未知错误，请稍后重试",
    );
  });

  // 回归：错误码文案都在 errors 命名空间里，调用方的 t 可能来自 useT("auth")，
  // 不带 ns 就会翻不到、静默退化成后端的调试描述
  it("所有查找都显式指定 errors 命名空间", () => {
    const t = makeT();

    getErrorMessage(
      axiosResponseError(backendError("AUTH_SOMETHING_NEW")),
      t as unknown as TFunction,
    );

    expect(t).toHaveBeenCalledWith(
      "AUTH_SOMETHING_NEW",
      expect.objectContaining({ ns: "errors" }),
    );
    expect(t).toHaveBeenCalledWith(
      "CLIENT_UNKNOWN_ERROR",
      expect.objectContaining({ ns: "errors" }),
    );
  });
});
