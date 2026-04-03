"use server";

import { redirect } from "next/navigation";

import {
  createClient,
  createContract,
  createRole,
  createUser,
  deleteClient,
  deleteContract,
  deleteRole,
  deleteUser,
  updateClient,
  updateContract,
  getAccessManagementErrorMessage,
  getFirstValidationError,
  isAccessManagementError,
  updateRole,
  updateUser,
} from "@/lib/access-management/backend";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value ? value : undefined;
}

function readNumberList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => Number(String(value)))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function appendMessage(path: string, type: "error" | "status", value: string) {
  const searchParams = new URLSearchParams();
  searchParams.set(type, value);
  return `${path}?${searchParams.toString()}`;
}

function getFallbackErrorMessage(error: unknown) {
  if (isAccessManagementError(error) && error.status === 422) {
    return getFirstValidationError(error);
  }

  return getAccessManagementErrorMessage(error);
}

function redirectForUnauthorized(error: unknown) {
  if (isAccessManagementError(error) && error.status === 401) {
    redirect(getAccessManagementErrorMessage(error));
  }
}

export async function createUserAction(formData: FormData) {
  try {
    await createUser({
      name: readString(formData, "name"),
      email: readString(formData, "email"),
      password: readString(formData, "password"),
      role_ids: formData.has("role_ids_present") ? readNumberList(formData, "role_ids") : undefined,
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/users/new", "error", getFallbackErrorMessage(error)));
  }

  redirect(appendMessage("/app/users", "status", "created"));
}

export async function updateUserAction(userId: number, formData: FormData) {
  try {
    await updateUser(userId, {
      name: readString(formData, "name"),
      email: readString(formData, "email"),
      password: readOptionalString(formData, "password"),
      role_ids: formData.has("role_ids_present") ? readNumberList(formData, "role_ids") : undefined,
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/users/${userId}/edit`, "error", getFallbackErrorMessage(error)));
  }

  redirect(appendMessage("/app/users", "status", "updated"));
}

export async function deleteUserAction(userId: number) {
  try {
    await deleteUser(userId);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/users", "error", getFallbackErrorMessage(error)));
  }

  redirect(appendMessage("/app/users", "status", "deleted"));
}

export async function createRoleAction(formData: FormData) {
  let roleId: number | null = null;

  try {
    const role = await createRole({
      name: readString(formData, "name"),
      permission_ids: formData.has("permission_ids_present")
        ? readNumberList(formData, "permission_ids")
        : undefined,
    });

    roleId = role.id;
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/roles/new", "error", getFallbackErrorMessage(error)));
  }

  redirect(`/app/roles/${roleId}/edit?status=created`);
}

export async function updateRoleAction(roleId: number, formData: FormData) {
  try {
    await updateRole(roleId, {
      name: readString(formData, "name"),
      permission_ids: formData.has("permission_ids_present")
        ? readNumberList(formData, "permission_ids")
        : undefined,
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/roles/${roleId}/edit`, "error", getFallbackErrorMessage(error)));
  }

  redirect(`/app/roles/${roleId}/edit?status=updated`);
}

export async function deleteRoleAction(roleId: number) {
  try {
    await deleteRole(roleId);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/roles", "error", getFallbackErrorMessage(error)));
  }

  redirect(appendMessage("/app/roles", "status", "deleted"));
}

function readOptionalCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "1";
}

export async function createClientAction(formData: FormData) {
  try {
    await createClient({
      address: readOptionalString(formData, "address"),
      client_code: readString(formData, "client_code"),
      company_name: readString(formData, "company_name"),
      contact_person: readOptionalString(formData, "contact_person"),
      email: readOptionalString(formData, "email"),
      phone: readOptionalString(formData, "phone"),
      portal_access_enabled: readOptionalCheckbox(formData, "portal_access_enabled"),
      status: readString(formData, "status"),
    });
  } catch (error) {
    redirectForUnauthorized(error)
    redirect(appendMessage("/app/clients/new", "error", getFallbackErrorMessage(error)))
  }

  redirect(appendMessage("/app/clients", "status", "created"))
}

export async function updateClientAction(clientId: number, formData: FormData) {
  try {
    await updateClient(clientId, {
      address: readOptionalString(formData, "address"),
      client_code: readString(formData, "client_code"),
      company_name: readString(formData, "company_name"),
      contact_person: readOptionalString(formData, "contact_person"),
      email: readOptionalString(formData, "email"),
      phone: readOptionalString(formData, "phone"),
      portal_access_enabled: readOptionalCheckbox(formData, "portal_access_enabled"),
      status: readString(formData, "status"),
    });
  } catch (error) {
    redirectForUnauthorized(error)
    redirect(appendMessage(`/app/clients/${clientId}/edit`, "error", getFallbackErrorMessage(error)))
  }

  redirect(appendMessage("/app/clients", "status", "updated"))
}

export async function deleteClientAction(clientId: number) {
  try {
    await deleteClient(clientId)
  } catch (error) {
    redirectForUnauthorized(error)
    redirect(appendMessage("/app/clients", "error", getFallbackErrorMessage(error)))
  }

  redirect(appendMessage("/app/clients", "status", "deleted"))
}

export async function createContractAction(formData: FormData) {
  let contractId: number | null = null

  try {
    const contract = await createContract({
      client_id: Number(readString(formData, "client_id")),
      contract_number: readString(formData, "contract_number"),
      contract_title: readString(formData, "contract_title"),
      project_name: readString(formData, "project_name"),
      contract_date: readString(formData, "contract_date"),
      start_date: readString(formData, "start_date"),
      end_date: readString(formData, "end_date"),
      contract_value: readString(formData, "contract_value"),
      project_scope: readString(formData, "project_scope"),
      payment_scheme_summary: readOptionalString(formData, "payment_scheme_summary"),
      contract_status: readString(formData, "contract_status"),
      notes: readOptionalString(formData, "notes"),
    })

    contractId = contract.id
  } catch (error) {
    redirectForUnauthorized(error)
    redirect(appendMessage("/app/contracts/new", "error", getFallbackErrorMessage(error)))
  }

  redirect(`/app/contracts/${contractId}/edit?status=created`)
}

export async function updateContractAction(contractId: number, formData: FormData) {
  try {
    await updateContract(contractId, {
      client_id: Number(readString(formData, "client_id")),
      contract_number: readString(formData, "contract_number"),
      contract_title: readString(formData, "contract_title"),
      project_name: readString(formData, "project_name"),
      contract_date: readString(formData, "contract_date"),
      start_date: readString(formData, "start_date"),
      end_date: readString(formData, "end_date"),
      contract_value: readString(formData, "contract_value"),
      project_scope: readString(formData, "project_scope"),
      payment_scheme_summary: readOptionalString(formData, "payment_scheme_summary"),
      contract_status: readString(formData, "contract_status"),
      notes: readOptionalString(formData, "notes"),
    })
  } catch (error) {
    redirectForUnauthorized(error)
    redirect(appendMessage(`/app/contracts/${contractId}/edit`, "error", getFallbackErrorMessage(error)))
  }

  redirect(appendMessage("/app/contracts", "status", "updated"))
}

export async function deleteContractAction(contractId: number) {
  try {
    await deleteContract(contractId)
  } catch (error) {
    redirectForUnauthorized(error)
    redirect(appendMessage("/app/contracts", "error", getFallbackErrorMessage(error)))
  }

  redirect(appendMessage("/app/contracts", "status", "deleted"))
}
