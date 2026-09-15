import { LogoMark } from "@/components/icons/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import AuthAside from "./_components/auth-aside";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[40%_minmax(0,1fr)]">
      <AuthAside />
      <section className="flex h-dvh items-start justify-center overflow-y-auto overscroll-contain px-6 py-10">
        <div className="flex w-full max-w-100 flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <LogoMark />
              <span className="font-semibold text-sm">远程协作工作台</span>
            </span>
            <ThemeToggle />
          </div>
          {children}
          <div className="inline-flex items-center justify-center">
            <span className="text-muted-foreground text-xs tabular-nums">
              远程协作工作台 · v1.0
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
