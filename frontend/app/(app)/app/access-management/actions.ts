"use server";

import { redirect } from "next/navigation";

import {
  createRole,
  createUser,
  deleteRole,
  deleteUser,
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
