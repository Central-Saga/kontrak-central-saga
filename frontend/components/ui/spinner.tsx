import * as React from "react";

import { cn } from "@/lib/utils";

type SpinnerProps = React.ComponentProps<"span"> & {
  size?: "sm" | "md";
};

const sizeClasses: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "size-4 border-2",
  md: "size-5 border-2",
};

export function Spinner({ className, size = "sm", ...props }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 animate-spin rounded-full border-current border-t-transparent",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
