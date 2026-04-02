import "server-only";

import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/auth/config";
import { fetchCurrentUser } from "@/lib/auth/backend";
import { isAuthError } from "@/lib/auth/errors";
import type { AuthSessionState } from "@/lib/auth/types";

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function setSessionToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

export async function clearSessionToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function readSessionState(): Promise<AuthSessionState> {
  const token = await getSessionToken();

  if (!token) {
    return { status: "guest" };
  }

  try {
    const user = await fetchCurrentUser(token);
    return { status: "authenticated", token, user };
  } catch (error) {
    if (isAuthError(error) && error.code === "unauthorized") {
      return { status: "stale", token };
    }

    throw error;
  }
}
