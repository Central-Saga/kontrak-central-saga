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

export type ClientRecord = {
  id: number;
  client_code: string;
  company_name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: string;
  portal_access_enabled: boolean;
  contracts_count?: number;
  active_contracts_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type ContractRecord = {
  id: number;
  client_id: number;
  client?: {
    id: number;
    client_code: string;
    company_name: string;
  } | null;
  contract_number: string;
  contract_title: string;
  project_name: string;
  contract_date: string;
  start_date: string;
  end_date: string;
  contract_value: string | number;
  project_scope: string;
  payment_scheme_summary?: string | null;
  contract_status: string;
  notes?: string | null;
  payment_terms_count?: number;
  project_progress_updates_count?: number;
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

export type ClientMutationInput = {
  client_code: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  portal_access_enabled?: boolean;
};

export type ContractMutationInput = {
  client_id: number;
  contract_number: string;
  contract_title: string;
  project_name: string;
  contract_date: string;
  start_date: string;
  end_date: string;
  contract_value: string;
  project_scope: string;
  payment_scheme_summary?: string;
  contract_status: string;
  notes?: string;
};

type OptionPageLoader<T extends AccessManagementOption> = (page: number) => Promise<PaginatedCollection<T>>;

const exportResourcePaths = {
  permissions: "/api/v1/exports/permissions",
  roles: "/api/v1/exports/roles",
  users: "/api/v1/exports/users",
} as const;

export type AccessManagementExportResource = keyof typeof exportResourcePaths;

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

function getDefaultApiErrorMessage(status: number) {
  return status === 401
    ? "Sesi Anda sudah tidak valid."
    : status === 403
      ? "Anda tidak memiliki akses ke modul ini."
      : status === 404
        ? "Data yang diminta tidak ditemukan."
        : status === 409
          ? "Data tidak dapat diproses karena masih dipakai oleh relasi lain."
          : status === 422
            ? "Data yang dikirim belum valid."
            : "Terjadi kesalahan saat berkomunikasi dengan backend.";
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

    throw new AccessManagementError(
      errorPayload?.message ?? getDefaultApiErrorMessage(response.status),
      response.status,
      errorPayload?.errors,
    );
  }

  return payload as T;
}

async function requestBackendResponse(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getSessionToken();

  if (!token) {
    throw new AccessManagementError("Sesi login tidak ditemukan.", 401);
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", headers.get("Accept") ?? "*/*");
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

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const errorPayload = contentType.includes("application/json")
      ? ((await response.json().catch(() => null)) as ApiErrorPayload | null)
      : null;

    throw new AccessManagementError(
      errorPayload?.message ?? getDefaultApiErrorMessage(response.status),
      response.status,
      errorPayload?.errors,
    );
  }

  return response;
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

export async function listClients(options: {
  search?: string;
  status?: string;
  perPage?: number;
} = {}): Promise<PaginatedCollection<ClientRecord>> {
  const query = buildQueryString({
    search: options.search,
    status: options.status,
    per_page: options.perPage ?? 10,
  });

  return requestBackend<PaginatedCollection<ClientRecord>>(`/api/v1/clients${query}`);
}

export async function getClient(clientId: number): Promise<ClientRecord> {
  const response = await requestBackend<DetailEnvelope<ClientRecord>>(`/api/v1/clients/${clientId}`);

  return response.data;
}

export async function createClient(input: ClientMutationInput): Promise<ClientRecord> {
  const response = await requestBackend<DetailEnvelope<ClientRecord>>("/api/v1/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateClient(clientId: number, input: ClientMutationInput): Promise<ClientRecord> {
  const response = await requestBackend<DetailEnvelope<ClientRecord>>(`/api/v1/clients/${clientId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function deleteClient(clientId: number): Promise<void> {
  await requestBackend<void>(`/api/v1/clients/${clientId}`, {
    method: "DELETE",
  });
}

export async function listContracts(options: {
  search?: string;
  status?: string;
  clientId?: number;
  perPage?: number;
} = {}): Promise<PaginatedCollection<ContractRecord>> {
  const query = buildQueryString({
    client_id: options.clientId,
    search: options.search,
    status: options.status,
    per_page: options.perPage ?? 10,
  });

  return requestBackend<PaginatedCollection<ContractRecord>>(`/api/v1/contracts${query}`);
}

export async function getContract(contractId: number): Promise<ContractRecord> {
  const response = await requestBackend<DetailEnvelope<ContractRecord>>(`/api/v1/contracts/${contractId}`);

  return response.data;
}

export async function createContract(input: ContractMutationInput): Promise<ContractRecord> {
  const response = await requestBackend<DetailEnvelope<ContractRecord>>("/api/v1/contracts", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateContract(contractId: number, input: ContractMutationInput): Promise<ContractRecord> {
  const response = await requestBackend<DetailEnvelope<ContractRecord>>(`/api/v1/contracts/${contractId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function deleteContract(contractId: number): Promise<void> {
  await requestBackend<void>(`/api/v1/contracts/${contractId}`, {
    method: "DELETE",
  });
}

export async function exportAccessManagementDataset(
  resource: AccessManagementExportResource,
  searchParams: URLSearchParams,
): Promise<Response> {
  const query = searchParams.toString();
  const path = exportResourcePaths[resource];

  return requestBackendResponse(query ? `${path}?${query}` : path, {
    method: "GET",
  });
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
