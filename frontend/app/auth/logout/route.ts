import { NextRequest, NextResponse } from "next/server";

import { isAuthError } from "@/lib/auth/errors";
import { logoutFromBackend } from "@/lib/auth/backend";
import { sanitizeInternalRedirectPath } from "@/lib/auth/navigation";
import { clearSessionToken, getSessionToken } from "@/lib/auth/session";

function buildRedirectResponse(redirectPath: string) {
  const safeRedirectPath = sanitizeInternalRedirectPath(redirectPath);

  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: safeRedirectPath,
    },
  });
}

export async function POST(request: NextRequest) {
  const token = await getSessionToken();

  if (token) {
    try {
      await logoutFromBackend(token);
    } catch (error) {
      if (!isAuthError(error) || error.code !== "unauthorized") {
        throw error;
      }
    }
  }

  await clearSessionToken();

  const redirectPath = request.nextUrl.searchParams.get("redirect");

  if (redirectPath) {
    return buildRedirectResponse(redirectPath);
  }

  return NextResponse.json(
    {
      loggedOut: true,
    },
    { status: 200 },
  );
}
