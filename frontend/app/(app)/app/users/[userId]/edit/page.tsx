import { updateUserAction } from "@/app/(app)/app/access-management/actions";
import { getUser, listRoleOptions } from "@/lib/access-management/backend";
import {
  handleModulePageError,
  readSearchParam,
  type PageRouteParams,
  type PageSearchParams,
} from "@/lib/access-management/page";
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared";
import { UserForm } from "@/components/access-management/user-form";

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: PageRouteParams<{ userId: string }>;
  searchParams: PageSearchParams;
}) {
  const [{ userId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const numericUserId = Number(userId);
  const error = readSearchParam(resolvedSearchParams, "error");

  let message: string | null = null;
  let user: Awaited<ReturnType<typeof getUser>> | null = null;

  try {
    user = await getUser(numericUserId);
  } catch (fetchError) {
    message = handleModulePageError(fetchError);
  }

  let roles = [] as Awaited<ReturnType<typeof listRoleOptions>>;
  let rolesError: string | null = null;

  try {
    roles = await listRoleOptions();
  } catch (fetchError) {
    rolesError = handleModulePageError(fetchError);
  }

  if (!user || rolesError) {
    return (
      <PageStack>
        <PageHeaderCard
          description="Detail pengguna atau opsi peran tidak bisa dimuat. Periksa akses Anda atau kembali ke daftar untuk mencoba lagi."
          title="Ubah pengguna"
        />
        <StatusBanner error={error ?? rolesError ?? message ?? undefined} />
      </PageStack>
    );
  }

  const updateAction = updateUserAction.bind(null, numericUserId);

  return (
    <PageStack>
      <PageHeaderCard
        description="Perubahan pengguna dikirim kembali ke backend lewat perantara server yang sama, jadi token sesi tetap aman di server."
        title={`Ubah pengguna: ${user.name}`}
      />

      <StatusBanner error={error ?? undefined} />
      <UserForm
        action={updateAction}
        mode="edit"
        roles={roles}
        values={{
          email: user.email,
          name: user.name,
          roleIds: (user.roles ?? []).map((role) => role.id),
        }}
      />
    </PageStack>
  );
}
