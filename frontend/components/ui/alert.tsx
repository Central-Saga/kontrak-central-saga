import * as React from "react";

import { cn } from "@/lib/utils";

type AlertProps = React.ComponentProps<"div"> & {
  variant?: "default" | "destructive";
};

const variantClasses: Record<NonNullable<AlertProps["variant"]>, string> = {
  default: "border-border/80 bg-background/80 text-foreground",
  destructive: "border-destructive/25 bg-destructive/8 text-foreground",
};

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-6 shadow-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("font-semibold text-foreground", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm leading-6 text-muted", className)} {...props} />;
}
