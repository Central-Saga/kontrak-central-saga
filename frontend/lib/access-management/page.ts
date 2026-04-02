import { notFound, redirect } from "next/navigation";

import { buildSessionExpiredRedirectPath } from "@/lib/auth/navigation";
import { AccessManagementError } from "@/lib/access-management/backend";

export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export type PageRouteParams<T extends Record<string, string>> = Promise<T>;

export function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function handleModulePageError(error: unknown): string {
  if (error instanceof AccessManagementError) {
    if (error.status === 401) {
      redirect(buildSessionExpiredRedirectPath());
    }

    if (error.status === 404) {
      notFound();
    }

    return error.message;
  }

  return "Terjadi masalah saat memuat modul. Silakan coba beberapa saat lagi.";
}
