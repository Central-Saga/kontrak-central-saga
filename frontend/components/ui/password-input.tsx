"use client";

import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        className={cn("pe-9", className)}
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground"
        onClick={() => setIsVisible((prev) => !prev)}
        tabIndex={-1}
        type="button"
      >
        {isVisible ? (
          <EyeOffIcon aria-hidden className="size-4" />
        ) : (
          <EyeIcon aria-hidden className="size-4" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };