import { NextRequest, NextResponse } from "next/server";

import { getAuthErrorMessage, isAuthError, normalizeAuthError } from "@/lib/auth/errors";
import { LOGIN_PATH } from "@/lib/auth/navigation";
import { resetPassword } from "@/lib/auth/backend";
import { clearSessionToken } from "@/lib/auth/session";

const RESET_PASSWORD_PATH = "/reset-password";

function isHtmlFormSubmission(request: NextRequest): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
}

function buildRedirect(path: string, query?: Record<string, string>): NextResponse {
  const searchParams = new URLSearchParams(query ?? {});
  const search = searchParams.toString();
  const location = `${path}${search ? `?${search}` : ""}`;

  return new NextResponse(null, {
    status: 303,
    headers: { Location: location },
  });
}

export async function POST(request: NextRequest) {
  const htmlFormSubmission = isHtmlFormSubmission(request);

  const payload = htmlFormSubmission
    ? ((await request.formData().catch(() => null)) as FormData | null)
    : ((await request.json().catch(() => null)) as
        | { email?: string; token?: string; password?: string; password_confirmation?: string }
        | null);

  const email = payload instanceof FormData ? String(payload.get("email") ?? "").trim() : payload?.email;
  const token = payload instanceof FormData ? String(payload.get("token") ?? "").trim() : payload?.token;
  const password = payload instanceof FormData ? String(payload.get("password") ?? "") : payload?.password;
  const passwordConfirmation =
    payload instanceof FormData
      ? String(payload.get("password_confirmation") ?? "")
      : payload?.password_confirmation;

  if (!email || !token || !password || !passwordConfirmation) {
    const message = "Email, token, password, dan konfirmasi password wajib diisi.";

    if (htmlFormSubmission) {
      return buildRedirect(RESET_PASSWORD_PATH, {
        error: "invalid_input",
        email: email ?? "",
        token: token ?? "",
      });
    }

    return NextResponse.json({ message }, { status: 422 });
  }

  try {
    const result = await resetPassword({
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    });

    await clearSessionToken();

    if (htmlFormSubmission) {
      return buildRedirect(LOGIN_PATH, { status: "password-reset" });
    }

    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch (error) {
    const normalized = normalizeAuthError(error);

    let message = getAuthErrorMessage(normalized);
    if (isAuthError(error) && error.errors) {
      for (const messages of Object.values(error.errors)) {
        const first = messages[0];
        if (first) {
          message = first;
          break;
        }
      }
    }

    if (htmlFormSubmission) {
      return buildRedirect(RESET_PASSWORD_PATH, {
        error: "invalid_input",
        email,
        token,
      });
    }

    return NextResponse.json(
      {
        code: normalized.code,
        message,
      },
      { status: normalized.status ?? 500 },
    );
  }
}
