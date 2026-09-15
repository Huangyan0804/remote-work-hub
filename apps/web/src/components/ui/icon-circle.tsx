import { cn } from "cn";
import * as React from "react";

export function IconCircle({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/16",
        className,
      )}
      {...props}
    />
  );
}
