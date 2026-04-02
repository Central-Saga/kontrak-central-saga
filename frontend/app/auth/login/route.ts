import { NextRequest, NextResponse } from "next/server";

import { APP_HOME_PATH, LOGIN_PATH } from "@/lib/auth/navigation";
import { getAuthErrorMessage, normalizeAuthError } from "@/lib/auth/errors";
import { loginWithBackend } from "@/lib/auth/backend";
import { setSessionToken } from "@/lib/auth/session";

function isHtmlFormSubmission(request: NextRequest): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
}

function buildLoginRedirect(_request: NextRequest, errorCode?: string) {
  const search = errorCode ? `?error=${encodeURIComponent(errorCode)}` : "";

  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: `${LOGIN_PATH}${search}`,
    },
  });
}

export async function POST(request: NextRequest) {
  const htmlFormSubmission = isHtmlFormSubmission(request);

  const payload = htmlFormSubmission
    ? ((await request.formData().catch(() => null)) as FormData | null)
    : ((await request.json().catch(() => null)) as { email?: string; password?: string } | null);

  const email = payload instanceof FormData ? String(payload.get("email") ?? "").trim() : payload?.email;
  const password = payload instanceof FormData ? String(payload.get("password") ?? "") : payload?.password;

  if (!email || !password) {
    if (htmlFormSubmission) {
      return buildLoginRedirect(request, "invalid_input");
    }

    return NextResponse.json(
      {
        message: "Email dan password wajib diisi.",
      },
      { status: 422 },
    );
  }

  try {
    const result = await loginWithBackend({
      email,
      password,
    });

    await setSessionToken(result.token);

    if (htmlFormSubmission) {
      return new NextResponse(null, {
        status: 303,
        headers: {
          Location: APP_HOME_PATH,
        },
      });
    }

    return NextResponse.json(
      {
        data: {
          user: result.user,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const authError = normalizeAuthError(error);

    if (htmlFormSubmission) {
      return buildLoginRedirect(request, authError.code);
    }

    return NextResponse.json(
      {
        code: authError.code,
        message: getAuthErrorMessage(authError),
      },
      { status: authError.status ?? 500 },
    );
  }
}
