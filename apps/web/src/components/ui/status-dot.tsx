import { cn } from "@/lib/utils";
import * as React from "react";

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * 状态颜色，默认为 emerald (绿色)
   */
  variant?: "success" | "warning" | "error" | "info";
  /**
   * 是否开启呼吸/闪烁动画，默认为 true
   */
  ping?: boolean;
  /**
   * 尺寸大小，默认 md (8px)
   */
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  success: {
    ping: "bg-emerald-400",
    dot: "bg-emerald-500",
  },
  warning: {
    ping: "bg-amber-400",
    dot: "bg-amber-500",
  },
  error: {
    ping: "bg-rose-400",
    dot: "bg-rose-500",
  },
  info: {
    ping: "bg-sky-400",
    dot: "bg-sky-500",
  },
};

const sizeStyles = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3.5 w-3.5",
};

export function StatusDot({
  variant = "success",
  ping = true,
  size = "md",
  className,
  ...props
}: StatusDotProps) {
  const currentVariant = variantStyles[variant] || variantStyles.success;
  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={cn(
        "relative flex items-center justify-center shrink-0",
        currentSize,
        className,
      )}
      {...props}
    >
      {ping && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            currentVariant.ping,
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex h-full w-full rounded-full",
          currentVariant.dot,
        )}
      />
    </span>
  );
}
