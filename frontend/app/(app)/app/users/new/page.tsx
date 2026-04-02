import { createUserAction } from "@/app/(app)/app/access-management/actions";
import { listRoleOptions } from "@/lib/access-management/backend";
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page";
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared";
import { UserForm } from "@/components/access-management/user-form";

export default async function NewUserPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams;
  const error = readSearchParam(resolvedSearchParams, "error");

  let roles = [] as Awaited<ReturnType<typeof listRoleOptions>>;
  let message: string | null = null;

  try {
    roles = await listRoleOptions();
  } catch (fetchError) {
    message = handleModulePageError(fetchError);
  }

  return (
    <PageStack>
      <PageHeaderCard
        description="Form tambah pengguna memakai server action agar proses kirim tetap aman, lalu meneruskan payload ke backend CRUD pengguna yang baru."
        title="Tambah pengguna"
      />

      <StatusBanner error={error ?? message ?? undefined} />
      <UserForm action={createUserAction} mode="create" roles={roles} />
    </PageStack>
  );
}
