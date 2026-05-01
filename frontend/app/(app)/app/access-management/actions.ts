"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createClient,
  createContract,
  createPayment,
  createPaymentTerm,
  createProjectProgress,
  createRole,
  createUser,
  deleteClient,
  deleteContract,
  deletePayment,
  deletePaymentTerm,
  deleteProjectProgress,
  deleteRole,
  deleteUser,
  getAccessManagementErrorMessage,
  getFirstValidationError,
  isAccessManagementError,
  updateClient,
  updateContract,
  updatePayment,
  updatePaymentTerm,
  updateProjectProgress,
  updateRole,
  updateUser,
  uploadContractDocumentVersion,
  uploadPaymentProof,
} from "@/lib/access-management/backend";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value ? value : undefined;
}

function readOptionalCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "1";
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
  searchParams.set("_r", Date.now().toString());
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

function revalidateAccessManagementPaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function createUserAction(formData: FormData) {
  let userId: number | null = null;

  try {
    const user = await createUser({
      name: readString(formData, "name"),
      email: readString(formData, "email"),
      password: readString(formData, "password"),
      role_ids: formData.has("role_ids_present") ? readNumberList(formData, "role_ids") : undefined,
    });

    userId = user.id;
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/users/new", "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/users", `/app/users/${userId}/edit`]);
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

  revalidateAccessManagementPaths(["/app/users", `/app/users/${userId}/edit`]);
  redirect(appendMessage("/app/users", "status", "updated"));
}

export async function deleteUserAction(userId: number) {
  try {
    await deleteUser(userId);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/users", "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/users", `/app/users/${userId}/edit`]);
  redirect(appendMessage("/app/users", "status", "deleted"));
}

export async function createRoleAction(formData: FormData) {
  let roleId: number | null = null;

  try {
    const role = await createRole({
      name: readString(formData, "name"),
      permission_ids: formData.has("permission_ids_present") ? readNumberList(formData, "permission_ids") : undefined,
    });

    roleId = role.id;
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/roles/new", "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/roles", `/app/roles/${roleId}/edit`]);
  redirect(appendMessage(`/app/roles/${roleId}/edit`, "status", "created"));
}

export async function updateRoleAction(roleId: number, formData: FormData) {
  try {
    await updateRole(roleId, {
      name: readString(formData, "name"),
      permission_ids: formData.has("permission_ids_present") ? readNumberList(formData, "permission_ids") : undefined,
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/roles/${roleId}/edit`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/roles", `/app/roles/${roleId}/edit`]);
  redirect(appendMessage(`/app/roles/${roleId}/edit`, "status", "updated"));
}

export async function deleteRoleAction(roleId: number) {
  try {
    await deleteRole(roleId);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/roles", "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/roles", `/app/roles/${roleId}/edit`]);
  redirect(appendMessage("/app/roles", "status", "deleted"));
}

export async function createClientAction(formData: FormData) {
  let clientId: number | null = null;

  try {
    const client = await createClient({
      address: readOptionalString(formData, "address"),
      client_code: readString(formData, "client_code"),
      company_name: readString(formData, "company_name"),
      contact_person: readOptionalString(formData, "contact_person"),
      email: readOptionalString(formData, "email"),
      phone: readOptionalString(formData, "phone"),
      portal_access_enabled: readOptionalCheckbox(formData, "portal_access_enabled"),
      status: readString(formData, "status"),
    });

    clientId = client.id;
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/clients/new", "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/clients", `/app/clients/${clientId}/edit`]);
  redirect(appendMessage("/app/clients", "status", "created"));
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
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/clients/${clientId}/edit`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/clients", `/app/clients/${clientId}/edit`]);
  redirect(appendMessage("/app/clients", "status", "updated"));
}

export async function deleteClientAction(clientId: number) {
  try {
    await deleteClient(clientId);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/clients", "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/clients", `/app/clients/${clientId}/edit`]);
  redirect(appendMessage("/app/clients", "status", "deleted"));
}

export async function createContractAction(formData: FormData) {
  let contractId: number | null = null;

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
    });

    contractId = contract.id;
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/contracts/new", "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}/edit`, "status", "created"));
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
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}/edit`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage("/app/contracts", "status", "updated"));
}

export async function deleteContractAction(contractId: number) {
  try {
    await deleteContract(contractId);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage("/app/contracts", "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage("/app/contracts", "status", "deleted"));
}

export async function createPaymentTermAction(contractId: number, formData: FormData) {
  try {
    await createPaymentTerm({
      contract_id: contractId,
      term_number: Number(readString(formData, "term_number")),
      term_title: readString(formData, "term_title"),
      due_date: readString(formData, "due_date"),
      amount: readString(formData, "amount"),
      description: readOptionalString(formData, "description"),
      status: readString(formData, "status"),
      payable_after_condition: readOptionalString(formData, "payable_after_condition"),
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}`, `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}`, "status", "payment_term_created"));
}

export async function updatePaymentTermAction(contractId: number, paymentTermId: number, formData: FormData) {
  try {
    await updatePaymentTerm(paymentTermId, {
      contract_id: contractId,
      term_number: Number(readString(formData, "term_number")),
      term_title: readString(formData, "term_title"),
      due_date: readString(formData, "due_date"),
      amount: readString(formData, "amount"),
      description: readOptionalString(formData, "description"),
      status: readString(formData, "status"),
      payable_after_condition: readOptionalString(formData, "payable_after_condition"),
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}`, `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}`, "status", "payment_term_updated"));
}

export async function deletePaymentTermAction(contractId: number, paymentTermId: number) {
  try {
    await deletePaymentTerm(paymentTermId);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}`, `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}`, "status", "payment_term_deleted"));
}

export async function createPaymentAction(contractId: number, formData: FormData) {
  try {
    await createPayment({
      payment_term_id: Number(readString(formData, "payment_term_id")),
      payment_date: readString(formData, "payment_date"),
      amount: readString(formData, "amount"),
      method: readString(formData, "method"),
      status: readString(formData, "status"),
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}`, `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}`, "status", "payment_created"));
}

export async function updatePaymentAction(contractId: number, paymentId: number, formData: FormData) {
  try {
    await updatePayment(paymentId, {
      payment_term_id: Number(readString(formData, "payment_term_id")),
      payment_date: readString(formData, "payment_date"),
      amount: readString(formData, "amount"),
      method: readString(formData, "method"),
      status: readString(formData, "status"),
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}`, `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}`, "status", "payment_updated"));
}

export async function deletePaymentAction(contractId: number, paymentId: number) {
  try {
    await deletePayment(paymentId);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}`, `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}`, "status", "payment_deleted"));
}

export async function uploadPaymentProofAction(contractId: number, paymentId: number, formData: FormData) {
  try {
    await uploadPaymentProof(paymentId, formData);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}`, `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}`, "status", "payment_proof_uploaded"));
}

export async function createProjectProgressAction(contractId: number, formData: FormData) {
  try {
    await createProjectProgress({
      contract_id: contractId,
      progress_date: readString(formData, "progress_date"),
      progress_title: readString(formData, "progress_title"),
      progress_description: readString(formData, "progress_description"),
      percentage: Number(readString(formData, "percentage")),
      status: readString(formData, "status"),
      milestone_reference: readOptionalString(formData, "milestone_reference"),
      notes: readOptionalString(formData, "notes"),
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}`, `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}`, "status", "project_progress_created"));
}

export async function updateProjectProgressAction(contractId: number, progressId: number, formData: FormData) {
  try {
    await updateProjectProgress(progressId, {
      contract_id: contractId,
      progress_date: readString(formData, "progress_date"),
      progress_title: readString(formData, "progress_title"),
      progress_description: readString(formData, "progress_description"),
      percentage: Number(readString(formData, "percentage")),
      status: readString(formData, "status"),
      milestone_reference: readOptionalString(formData, "milestone_reference"),
      notes: readOptionalString(formData, "notes"),
    });
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}`, `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}`, "status", "project_progress_updated"));
}

export async function deleteProjectProgressAction(contractId: number, progressId: number) {
  try {
    await deleteProjectProgress(progressId);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(`/app/contracts/${contractId}`, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths(["/app/contracts", `/app/contracts/${contractId}`, `/app/contracts/${contractId}/edit`]);
  redirect(appendMessage(`/app/contracts/${contractId}`, "status", "project_progress_deleted"));
}

export async function uploadContractDocumentVersionAction(
  contractId: number,
  redirectPathOrFormData: string | FormData,
  maybeFormData?: FormData,
) {
  const redirectPath = typeof redirectPathOrFormData === "string" ? redirectPathOrFormData : `/app/contracts/${contractId}/versions`;
  const formData = typeof redirectPathOrFormData === "string" ? maybeFormData : redirectPathOrFormData;

  if (!formData) {
    throw new Error("Form data is required.");
  }

  try {
    await uploadContractDocumentVersion(contractId, formData);
  } catch (error) {
    redirectForUnauthorized(error);
    redirect(appendMessage(redirectPath, "error", getFallbackErrorMessage(error)));
  }

  revalidateAccessManagementPaths([
    "/app/contracts",
    `/app/contracts/${contractId}/edit`,
    `/app/contracts/${contractId}/versions`,
    `/app/contracts/${contractId}/documents`,
  ]);
  redirect(appendMessage(redirectPath, "status", "document_uploaded"));
}
