/**
 * 整页硬跳转。
 * 单独抽成一个函数是为了单测能 mock —— jsdom 不允许真的导航，
 * 直接给 window.location.href 赋值只会打印 "Not implemented: navigation"。
 */
export function hardRedirect(url: string): void {
  window.location.href = url;
}
