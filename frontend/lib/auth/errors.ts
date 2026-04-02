import "server-only";

export type AuthErrorCode =
  | "invalid_credentials"
  | "unauthorized"
  | "network_error"
  | "unknown_error";

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    public readonly status?: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function normalizeAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  if (error instanceof Error) {
    return new AuthError("unknown_error", error.message);
  }

  return new AuthError("unknown_error", "Terjadi kesalahan autentikasi.");
}

export function getAuthErrorMessage(error: unknown): string {
  const authError = normalizeAuthError(error);

  if (authError.code === "invalid_credentials") {
    return "Email atau password tidak valid.";
  }

  if (authError.code === "network_error") {
    return "Layanan autentikasi sedang tidak tersedia.";
  }

  if (authError.code === "unauthorized") {
    return "Sesi Anda sudah tidak valid.";
  }

  return "Terjadi kesalahan autentikasi.";
}

export function getFirstAuthValidationMessage(error: AuthError): string {
  if (!error.errors) {
    return error.message
  }

  for (const messages of Object.values(error.errors)) {
    const firstMessage = messages[0]

    if (firstMessage) {
      return firstMessage
    }
  }

  return error.message
}
