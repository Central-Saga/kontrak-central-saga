import { createRoleAction } from "@/app/(app)/app/access-management/actions";
import { listPermissionOptions } from "@/lib/access-management/backend";
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page";
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared";
import { RoleForm } from "@/components/access-management/role-form";

export default async function NewRolePage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams;
  const error = readSearchParam(resolvedSearchParams, "error");

  let permissions = [] as Awaited<ReturnType<typeof listPermissionOptions>>;
  let message: string | null = null;

  try {
    permissions = await listPermissionOptions();
  } catch (fetchError) {
    message = handleModulePageError(fetchError);
  }

  return (
    <PageStack>
      <PageHeaderCard
        description="Susun peran baru dari satu halaman yang lebih rapi: identitas peran di sisi kiri, lalu kelompok izin akses yang siap dipilih berdasarkan modul di sisi kanan."
        title="Tambah peran"
      />

      <StatusBanner error={error ?? message ?? undefined} />
      <RoleForm action={createRoleAction} mode="create" permissions={permissions} />
    </PageStack>
  );
}
