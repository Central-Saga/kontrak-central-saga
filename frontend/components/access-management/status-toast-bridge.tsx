"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type StatusToastBridgeProps = {
  error?: string;
  messages?: Record<string, string>;
  status?: string;
};

function StatusToastBridgeInner({ error, messages, status }: StatusToastBridgeProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusMessage = status ? messages?.[status] : undefined;

  useEffect(() => {
    if (!searchParams.has("error") && !searchParams.has("status")) {
      return;
    }

    if (error) {
      toast.error("Perlu perhatian", {
        description: error,
      });
    } else if (statusMessage) {
      toast.success("Perubahan tersimpan", {
        description: statusMessage,
      });
    } else {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("error");
    nextSearchParams.delete("status");

    const nextQuery = nextSearchParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    window.history.replaceState(window.history.state, "", nextUrl);
  }, [error, pathname, searchParams, statusMessage]);

  return null;
}

export function StatusToastBridge(props: StatusToastBridgeProps) {
  return (
    <Suspense fallback={null}>
      <StatusToastBridgeInner {...props} />
    </Suspense>
  );
}
