import { deleteRoleAction, updateRoleAction } from "@/app/(app)/app/access-management/actions";
import { getRole, listPermissionOptions } from "@/lib/access-management/backend";
import {
  handleModulePageError,
  readSearchParam,
  type PageRouteParams,
  type PageSearchParams,
} from "@/lib/access-management/page";
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge";
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared";
import { RoleForm } from "@/components/access-management/role-form";

export default async function EditRolePage({
  params,
  searchParams,
}: {
  params: PageRouteParams<{ roleId: string }>;
  searchParams: PageSearchParams;
}) {
  const [{ roleId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const numericRoleId = Number(roleId);
  const error = readSearchParam(resolvedSearchParams, "error");
  const status = readSearchParam(resolvedSearchParams, "status");

  const statusMessages = {
    created: "Peran baru berhasil dibuat.",
    updated: "Perubahan peran berhasil disimpan.",
  };

  let message: string | null = null;
  let role: Awaited<ReturnType<typeof getRole>> | null = null;

  try {
    role = await getRole(numericRoleId);
  } catch (fetchError) {
    message = handleModulePageError(fetchError);
  }

  let permissions = [] as Awaited<ReturnType<typeof listPermissionOptions>>;
  let permissionsError: string | null = null;

  try {
    permissions = await listPermissionOptions();
  } catch (fetchError) {
    permissionsError = handleModulePageError(fetchError);
  }

  if (!role || permissionsError) {
    return (
      <PageStack>
        <PageHeaderCard
          description="Detail peran atau opsi izin akses tidak bisa dimuat. Periksa akses Anda atau kembali ke daftar peran."
          title="Ubah peran"
        />
        <StatusToastBridge error={error ?? undefined} />
        <StatusBanner error={permissionsError ?? message ?? undefined} />
      </PageStack>
    );
  }

  const updateAction = updateRoleAction.bind(null, numericRoleId);
  const deleteAction = deleteRoleAction.bind(null, numericRoleId);

  return (
    <PageStack>
      <PageHeaderCard
        description="Atur ulang nama peran dan penugasan izin akses dalam layout yang lebih terstruktur, tetap memakai server action yang sama untuk memperbarui dan menghapus peran."
        title={`Ubah peran: ${role.name}`}
      />

      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />
      <RoleForm
        action={updateAction}
        deleteAction={deleteAction}
        mode="edit"
        permissions={permissions}
        values={{
          name: role.name,
          permissionIds: (role.permissions ?? []).map((permission) => permission.id),
        }}
      />
    </PageStack>
  );
}
