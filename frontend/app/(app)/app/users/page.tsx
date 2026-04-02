import { deleteUserAction } from "@/app/(app)/app/access-management/actions";
import { listUsers } from "@/lib/access-management/backend";
import { buildForwardedSearchParams, handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page";
import { ExportActionMenu } from "@/components/access-management/export-action-menu";
import { RowActionButtons } from "@/components/access-management/row-action-buttons";
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyStateCard, PageHeaderCard, PageStack, PillList, StatusBanner } from "@/components/access-management/shared";

const statusMessages = {
  created: "Pengguna baru berhasil ditambahkan.",
  updated: "Data pengguna berhasil diperbarui.",
  deleted: "Pengguna berhasil dihapus.",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const search = readSearchParam(resolvedSearchParams, "search") ?? "";
  const status = readSearchParam(resolvedSearchParams, "status");
  const error = readSearchParam(resolvedSearchParams, "error");
  const exportQueryString = buildForwardedSearchParams(resolvedSearchParams).toString();

  let message: string | null = null;
  let usersResponse: Awaited<ReturnType<typeof listUsers>> | null = null;

  try {
    usersResponse = await listUsers({ perPage: 20, search });
  } catch (fetchError) {
    message = handleModulePageError(fetchError);
  }

  return (
    <PageStack data-testid="users-list-page">
      <PageHeaderCard
        actionHref="/app/users/new"
        actionLabel="Tambah pengguna"
        description="Daftar pengguna kini berada di halaman terpisah dengan pencarian, ubah, dan hapus yang terhubung langsung ke API backend `/api/v1/users`."
        title="Kelola pengguna"
      />

      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />
      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Daftar pengguna</CardTitle>
            <CardDescription>Cari berdasarkan nama atau email, lalu lanjutkan ke halaman tambah atau ubah sesuai kebutuhan.</CardDescription>
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-3 lg:items-end">
            <form className="flex w-full flex-col gap-3 sm:flex-row" method="GET">
              <Input data-testid="users-search-input" defaultValue={search} name="search" placeholder="Cari nama atau email" />
              <Button type="submit" variant="outline">Cari</Button>
            </form>

            <ExportActionMenu moduleLabel="daftar pengguna" queryString={exportQueryString} resource="users" />
          </div>
        </CardHeader>
        <CardContent>
          {usersResponse ? (
            usersResponse.data.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      <th className="border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Nama</th>
                      <th className="border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Email</th>
                      <th className="border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Peran</th>
                      <th className="border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersResponse.data.map((user) => {
                      const deleteAction = deleteUserAction.bind(null, user.id);

                      return (
                        <tr key={user.id}>
                          <td className="border border-line px-4 py-4 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-foreground">{user.name}</span>
                              <span className="text-xs text-muted">ID #{user.id}</span>
                            </div>
                          </td>
                          <td className="border border-line px-4 py-4 align-top text-muted">{user.email}</td>
                          <td className="border border-line px-4 py-4 align-top">
                            <PillList emptyLabel="Belum ada peran" items={(user.roles ?? []).map((role) => role.name)} />
                          </td>
                          <td className="border border-line px-4 py-4 align-top">
                            <RowActionButtons
                              deleteAction={deleteAction}
                              deleteLabel={`Hapus ${user.name}`}
                              deleteTestId={`users-row-delete-${user.id}`}
                              editHref={`/app/users/${user.id}/edit`}
                              editLabel={`Ubah ${user.name}`}
                              editTestId={`users-row-edit-${user.id}`}
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
                description="Coba ubah kata kunci pencarian atau tambahkan pengguna baru dari tombol di atas."
                title="Belum ada pengguna yang cocok dengan pencarian ini"
              />
            )
          ) : null}
        </CardContent>
      </Card>
    </PageStack>
  );
}
