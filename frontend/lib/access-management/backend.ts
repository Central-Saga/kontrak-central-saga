import "server-only";

import { getServerApiBaseUrl } from "@/lib/auth/config";
import { buildSessionExpiredRedirectPath } from "@/lib/auth/navigation";
import { getSessionToken } from "@/lib/auth/session";

type CollectionEnvelope<T> = {
  data: T[];
  links: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
};

type DetailEnvelope<T> = {
  data: T;
};

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export type AccessManagementOption = {
  id: number;
  name: string;
  guard_name: string;
};

export type UserRecord = {
  id: number;
  name: string;
  email: string;
  roles_count?: number;
  roles?: AccessManagementOption[];
  created_at?: string;
  updated_at?: string;
};

export type RoleRecord = {
  id: number;
  name: string;
  guard_name: string;
  users_count?: number;
  permissions_count?: number;
  permissions?: AccessManagementOption[];
  created_at?: string;
  updated_at?: string;
};

type PermissionRecord = {
  id: number;
  name: string;
  guard_name: string;
  roles_count?: number;
  roles?: AccessManagementOption[];
  created_at?: string;
  updated_at?: string;
};

export type PaginatedCollection<T> = CollectionEnvelope<T>;

export type UserMutationInput = {
  name: string;
  email: string;
  password?: string;
  role_ids?: number[];
};

export type RoleMutationInput = {
  name: string;
  permission_ids?: number[];
};

type OptionPageLoader<T extends AccessManagementOption> = (page: number) => Promise<PaginatedCollection<T>>;

export class AccessManagementError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AccessManagementError";
  }
}

function buildQueryString(searchParams: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    query.set(key, String(value));
  }

  const serialized = query.toString();

  return serialized ? `?${serialized}` : "";
}

async function requestBackend<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getSessionToken();

  if (!token) {
    throw new AccessManagementError("Sesi login tidak ditemukan.", 401);
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${getServerApiBaseUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new AccessManagementError("Layanan backend tidak dapat dijangkau.", 503);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | T | null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;
    const defaultMessage =
      response.status === 401
        ? "Sesi Anda sudah tidak valid."
        : response.status === 403
          ? "Anda tidak memiliki akses ke modul ini."
          : response.status === 404
            ? "Data yang diminta tidak ditemukan."
            : response.status === 409
              ? "Data tidak dapat diproses karena masih dipakai oleh relasi lain."
              : response.status === 422
                ? "Data yang dikirim belum valid."
                : "Terjadi kesalahan saat berkomunikasi dengan backend.";

    throw new AccessManagementError(
      errorPayload?.message ?? defaultMessage,
      response.status,
      errorPayload?.errors,
    );
  }

  return payload as T;
}

export function isAccessManagementError(error: unknown): error is AccessManagementError {
  return error instanceof AccessManagementError;
}

export function getAccessManagementErrorMessage(error: unknown): string {
  if (isAccessManagementError(error)) {
    if (error.status === 401) {
      return buildSessionExpiredRedirectPath();
    }

    return error.message;
  }

  return "Terjadi kesalahan yang tidak dikenali.";
}

export function getFirstValidationError(error: AccessManagementError): string {
  if (!error.errors) {
    return error.message;
  }

  for (const messages of Object.values(error.errors)) {
    const firstMessage = messages[0];

    if (firstMessage) {
      return firstMessage;
    }
  }

  return error.message;
}

export async function listUsers(options: {
  search?: string;
  roleId?: number;
  perPage?: number;
} = {}): Promise<PaginatedCollection<UserRecord>> {
  const query = buildQueryString({
    search: options.search,
    role_id: options.roleId,
    per_page: options.perPage ?? 10,
  });

  return requestBackend<PaginatedCollection<UserRecord>>(`/api/v1/users${query}`, {
    method: "GET",
  });
}

export async function getUser(userId: number): Promise<UserRecord> {
  const payload = await requestBackend<DetailEnvelope<UserRecord>>(`/api/v1/users/${userId}`, {
    method: "GET",
  });

  return payload.data;
}

export async function createUser(input: UserMutationInput): Promise<UserRecord> {
  const payload = await requestBackend<DetailEnvelope<UserRecord>>(`/api/v1/users`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return payload.data;
}

export async function updateUser(userId: number, input: UserMutationInput): Promise<UserRecord> {
  const payload = await requestBackend<DetailEnvelope<UserRecord>>(`/api/v1/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  return payload.data;
}

export async function deleteUser(userId: number): Promise<void> {
  await requestBackend<void>(`/api/v1/users/${userId}`, {
    method: "DELETE",
  });
}

export async function listRoles(options: {
  page?: number;
  search?: string;
  permissionId?: number;
  perPage?: number;
} = {}): Promise<PaginatedCollection<RoleRecord>> {
  const query = buildQueryString({
    page: options.page,
    search: options.search,
    permission_id: options.permissionId,
    per_page: options.perPage ?? 10,
  });

  return requestBackend<PaginatedCollection<RoleRecord>>(`/api/v1/roles${query}`, {
    method: "GET",
  });
}

export async function getRole(roleId: number): Promise<RoleRecord> {
  const payload = await requestBackend<DetailEnvelope<RoleRecord>>(`/api/v1/roles/${roleId}`, {
    method: "GET",
  });

  return payload.data;
}

export async function createRole(input: RoleMutationInput): Promise<RoleRecord> {
  const payload = await requestBackend<DetailEnvelope<RoleRecord>>(`/api/v1/roles`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return payload.data;
}

export async function updateRole(roleId: number, input: RoleMutationInput): Promise<RoleRecord> {
  const payload = await requestBackend<DetailEnvelope<RoleRecord>>(`/api/v1/roles/${roleId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  return payload.data;
}

export async function deleteRole(roleId: number): Promise<void> {
  await requestBackend<void>(`/api/v1/roles/${roleId}`, {
    method: "DELETE",
  });
}

async function listPermissions(options: {
  page?: number;
  search?: string;
  action?: string;
  module?: string;
  perPage?: number;
} = {}): Promise<PaginatedCollection<PermissionRecord>> {
  const query = buildQueryString({
    page: options.page,
    search: options.search,
    action: options.action,
    module: options.module,
    per_page: options.perPage ?? 10,
  });

  return requestBackend<PaginatedCollection<PermissionRecord>>(`/api/v1/permissions${query}`, {
    method: "GET",
  });
}

export async function listRoleOptions(): Promise<AccessManagementOption[]> {
  const roles = await loadAllOptions((page) => listRoles({ perPage: 100, page }));

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    guard_name: role.guard_name,
  }));
}

export async function listPermissionOptions(): Promise<AccessManagementOption[]> {
  const permissions = await loadAllOptions((page) => listPermissions({ perPage: 100, page }));

  return permissions.map((permission) => ({
    id: permission.id,
    name: permission.name,
    guard_name: permission.guard_name,
  }));
}

async function loadAllOptions<T extends AccessManagementOption>(
  loadPage: OptionPageLoader<T>,
): Promise<T[]> {
  const items: T[] = [];
  let currentPage = 1;
  let lastPage = 1;

  do {
    const response = await loadPage(currentPage);
    items.push(...response.data);
    lastPage = response.meta.last_page;
    currentPage += 1;
  } while (currentPage <= lastPage);

  return items;
}
