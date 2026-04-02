import { notFound, redirect } from "next/navigation";

import { buildSessionExpiredRedirectPath } from "@/lib/auth/navigation";
import { AccessManagementError } from "@/lib/access-management/backend";

export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export type PageRouteParams<T extends Record<string, string>> = Promise<T>;

const exportSearchParamExclusions = new Set(["error", "status"]);

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

export function buildForwardedSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const forwardedSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (exportSearchParamExclusions.has(key) || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          forwardedSearchParams.append(key, item);
        }
      }

      continue;
    }

    if (value) {
      forwardedSearchParams.set(key, value);
    }
  }

  return forwardedSearchParams;
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
