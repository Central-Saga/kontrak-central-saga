export const APP_HOME_PATH = "/app";
export const LOGIN_PATH = "/login";

export function sanitizeInternalRedirectPath(redirectPath: string | null | undefined): string {
  if (!redirectPath || !redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return LOGIN_PATH;
  }

  return redirectPath;
}

export function buildSessionExpiredRedirectPath(): string {
  return `/auth/session/clear?redirect=${encodeURIComponent(`${LOGIN_PATH}?reason=session-expired`)}`;
}
