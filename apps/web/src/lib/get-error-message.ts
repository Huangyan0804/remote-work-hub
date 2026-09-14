import type { APIError } from "@repo/types";
import axios from "axios";
import type { TFunction } from "i18next";

export function getErrorMessage(error: unknown, t: TFunction): string {
  // 1. axios 错误且服务端有响应 —— 后端返回了统一错误结构
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as Partial<APIError> | undefined;

    if (data?.code) {
      // i18next 找不到 key 时返回 defaultValue，据此判断"翻到没翻到"
      const translated = t(data.code, { defaultValue: "" });
      if (translated) return translated;
    }

    // 词典里没有这个码（后端加了新码、前端还没补文案）→ 退回后端的调试描述
    if (data?.message) return data.message;
    return t("CLIENT_UNKNOWN_ERROR");
  }

  // 2. axios 错误但没有 response —— 断网 / 超时 / 服务没起来
  if (axios.isAxiosError(error)) {
    return t("CLIENT_NETWORK_ERROR");
  }

  // 3. 其他（代码 bug、JSON 解析失败等）
  return t("CLIENT_UNKNOWN_ERROR");
}
