import { deleteRoleAction } from "@/app/(app)/app/access-management/actions";
import { listRoles } from "@/lib/access-management/backend";
import { buildForwardedSearchParams, handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page";
import { ExportActionMenu } from "@/components/access-management/export-action-menu";
import { RolePermissionsDetailSheet } from "@/components/access-management/role-permissions-detail-sheet";
import { RowActionButtons } from "@/components/access-management/row-action-buttons";
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyStateCard, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared";

const statusMessages = {
  created: "Peran baru berhasil ditambahkan.",
  updated: "Peran berhasil diperbarui.",
  deleted: "Peran berhasil dihapus.",
};

export default async function RolesPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams;
  const search = readSearchParam(resolvedSearchParams, "search") ?? "";
  const status = readSearchParam(resolvedSearchParams, "status");
  const error = readSearchParam(resolvedSearchParams, "error");
  const exportQueryString = buildForwardedSearchParams(resolvedSearchParams).toString();

  let message: string | null = null;
  let rolesResponse: Awaited<ReturnType<typeof listRoles>> | null = null;

  try {
    rolesResponse = await listRoles({ perPage: 20, search });
  } catch (fetchError) {
    message = handleModulePageError(fetchError);
  }

  return (
    <PageStack data-testid="roles-list-page">
      <PageHeaderCard
        actionHref="/app/roles/new"
        actionLabel="Tambah peran"
        description="Peran dipisah ke halaman CRUD sendiri agar daftar, ubah, dan penghapusan tidak lagi tercampur di landing `/app`."
        title="Kelola peran"
      />

      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />
      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Daftar peran</CardTitle>
            <CardDescription>Cari peran yang dibutuhkan, lalu buka halaman ubah untuk menyesuaikan izin akses terkait.</CardDescription>
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-3 lg:items-end">
            <form className="flex w-full flex-col gap-3 sm:flex-row" method="GET">
              <Input data-testid="roles-search-input" defaultValue={search} name="search" placeholder="Cari nama peran" />
              <Button type="submit" variant="outline">Cari</Button>
            </form>

            <ExportActionMenu moduleLabel="daftar peran" queryString={exportQueryString} resource="roles" />
          </div>
        </CardHeader>
        <CardContent>
          {rolesResponse ? (
            rolesResponse.data.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      <th className="border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Peran</th>
                      <th className="border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Ringkasan</th>
                      <th className="border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolesResponse.data.map((role) => {
                      const deleteAction = deleteRoleAction.bind(null, role.id);

                      return (
                        <tr key={role.id}>
                          <td className="border border-line px-4 py-4 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-foreground">{role.name}</span>
                              <span className="text-xs text-muted">Penjaga: {role.guard_name}</span>
                            </div>
                          </td>
                          <td className="border border-line px-4 py-4 align-top text-muted">
                            {role.users_count ?? 0} pengguna • {role.permissions_count ?? 0} izin akses
                          </td>
                          <td className="border border-line px-4 py-4 align-top">
                            <RowActionButtons
                              deleteAction={deleteAction}
                              deleteLabel={`Hapus ${role.name}`}
                              deleteTestId={`roles-row-delete-${role.id}`}
                              editHref={`/app/roles/${role.id}/edit`}
                              editLabel={`Ubah ${role.name}`}
                              editTestId={`roles-row-edit-${role.id}`}
                              leadingActions={
                                <RolePermissionsDetailSheet
                                  permissions={role.permissions ?? []}
                                  roleName={role.name}
                                  triggerMode="icon"
                                  triggerTestId={`roles-row-permissions-${role.id}`}
                                />
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyStateCard
                description="Ubah kata kunci pencarian atau tambahkan peran baru bila belum tersedia."
                title="Tidak ada peran yang cocok dengan pencarian"
              />
            )
          ) : null}
        </CardContent>
      </Card>
    </PageStack>
  );
}
