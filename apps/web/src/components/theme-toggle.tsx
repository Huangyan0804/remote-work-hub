"use client";

import { cn } from "cn";
import { SunMoon } from "lucide-react";
import { useT } from "next-i18next/client";
import { useTheme } from "next-themes";
import type * as React from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { t } = useT("common");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("theme.toggle")}
      className={cn("size-8 text-muted-foreground", className)}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      {...props}
    >
      <SunMoon className="size-5" />
    </Button>
  );
}
