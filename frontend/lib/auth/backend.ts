import "server-only";

import { AUTH_DEVICE_NAME, getServerApiBaseUrl } from "@/lib/auth/config";
import { AuthError } from "@/lib/auth/errors";
import type { AuthLoginInput, AuthLoginResult, AuthUser } from "@/lib/auth/types";

type BackendAuthEnvelope<T> = {
  data: T;
};

type RawAuthUser = {
  id: number;
  name: string;
  username?: string | null;
  email: string;
  roles?: string[];
  permissions?: string[];
  avatar_url?: string | null;
  avatarUrl?: string | null;
  photo_url?: string | null;
  photoUrl?: string | null;
};

type RawAuthLoginResult = {
  token: string;
  token_type?: string;
  tokenType?: string;
  user: RawAuthUser;
};

const AUTH_AVATAR_ENDPOINT = "/api/v1/auth/avatar";

function normalizeUser(user: RawAuthUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username ?? null,
    email: user.email,
    roles: user.roles ?? [],
    permissions: user.permissions ?? [],
    avatarUrl: user.avatar_url ?? user.avatarUrl ?? user.photo_url ?? user.photoUrl ?? null,
  };
}

async function requestBackend<T>(
  path: string,
  init: RequestInit & { invalidCredentialsMessage?: string; token?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${getServerApiBaseUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new AuthError("network_error", "Layanan autentikasi sedang tidak tersedia.", 503);
  }

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; errors?: Record<string, string[]> }
    | null;

  if (response.status === 401) {
    throw new AuthError("unauthorized", "Sesi Anda sudah tidak valid.", response.status);
  }

  if (response.status === 422) {
    if (init.invalidCredentialsMessage) {
      throw new AuthError("invalid_credentials", init.invalidCredentialsMessage, response.status);
    }

    throw new AuthError(
      "unknown_error",
      payload?.message ?? "Data yang dikirim belum valid.",
      response.status,
      payload?.errors,
    );
  }

  if (!response.ok) {
    throw new AuthError(
      "unknown_error",
      payload?.message ?? "Terjadi kesalahan autentikasi.",
      response.status,
      payload?.errors,
    );
  }

  return payload as T;
}

export async function loginWithBackend(input: AuthLoginInput): Promise<AuthLoginResult> {
  const payload = await requestBackend<BackendAuthEnvelope<RawAuthLoginResult>>("/api/v1/auth/login", {
    method: "POST",
    invalidCredentialsMessage: "Email atau password tidak valid.",
    body: JSON.stringify({
      ...input,
      device_name: AUTH_DEVICE_NAME,
    }),
  });

  return {
    token: payload.data.token,
    tokenType: payload.data.token_type ?? payload.data.tokenType ?? "Bearer",
    user: normalizeUser(payload.data.user),
  };
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const payload = await requestBackend<BackendAuthEnvelope<RawAuthUser>>("/api/v1/auth/me", {
    method: "GET",
    token,
  });

  return normalizeUser(payload.data);
}

export async function logoutFromBackend(token: string): Promise<void> {
  await requestBackend<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
    token,
  });
}

export async function uploadCurrentUserAvatar(token: string, avatar: File): Promise<AuthUser | null> {
  const formData = new FormData();
  formData.set("avatar", avatar);

  const payload = await requestBackend<BackendAuthEnvelope<RawAuthUser> | null>(AUTH_AVATAR_ENDPOINT, {
    method: "POST",
    token,
    body: formData,
  });

  if (!payload || !("data" in payload) || !payload.data) {
    return null;
  }

  return normalizeUser(payload.data);
}

export async function updateCurrentUserProfile(
  token: string,
  input: {
    email: string
    name: string
    username: string | null
  }
): Promise<AuthUser> {
  const payload = await requestBackend<BackendAuthEnvelope<RawAuthUser>>("/api/v1/auth/profile", {
    method: "PUT",
    token,
    body: JSON.stringify(input),
  })

  return normalizeUser(payload.data)
}

export async function updateCurrentUserPassword(
  token: string,
  input: {
    current_password: string
    password: string
    password_confirmation: string
  }
): Promise<void> {
  await requestBackend<{ message: string }>("/api/v1/auth/password", {
    method: "PUT",
    token,
    body: JSON.stringify(input),
  })
}
