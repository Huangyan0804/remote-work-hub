"use client";

import { cn } from "cn";
import { SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import type * as React from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="切换亮暗主题"
      className={cn("size-8 text-muted-foreground", className)}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      {...props}
    >
      <SunMoon className="size-5" />
    </Button>
  );
}
