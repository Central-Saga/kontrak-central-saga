import "server-only";

export const AUTH_COOKIE_NAME = "kcs_session_token";
export const AUTH_DEVICE_NAME = "kontrak-central-saga-web";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function getServerApiBaseUrl(): string {
  const serverApiBaseUrl = process.env.SERVER_API_BASE_URL;

  if (!serverApiBaseUrl) {
    throw new Error("SERVER_API_BASE_URL is not configured.");
  }

  return serverApiBaseUrl;
}

function shouldUseSecureCookies(): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return process.env.NODE_ENV === "production";
  }

  return appUrl.startsWith("https://");
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}
