import { NextRequest, NextResponse } from "next/server";

import { sanitizeInternalRedirectPath } from "@/lib/auth/navigation";
import { clearSessionToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const redirectPath = request.nextUrl.searchParams.get("redirect") ?? "/login";
  const safeRedirectPath = sanitizeInternalRedirectPath(redirectPath);

  await clearSessionToken();

  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: safeRedirectPath,
    },
  });
}
