import Link from "next/link";

import { deleteRoleAction } from "@/app/(app)/app/access-management/actions";
import { listRoles } from "@/lib/access-management/backend";
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyStateCard, PageHeaderCard, PageStack, PillList, StatusBanner } from "@/components/access-management/shared";

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

      <StatusBanner error={error ?? message ?? undefined} messages={statusMessages} status={status} />

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Daftar peran</CardTitle>
            <CardDescription>Cari peran yang dibutuhkan, lalu buka halaman ubah untuk menyesuaikan izin akses terkait.</CardDescription>
          </div>

          <form className="flex w-full max-w-xl flex-col gap-3 sm:flex-row" method="GET">
            <Input data-testid="roles-search-input" defaultValue={search} name="search" placeholder="Cari nama peran" />
            <Button type="submit" variant="outline">Cari</Button>
          </form>
        </CardHeader>
        <CardContent>
          {rolesResponse ? (
            rolesResponse.data.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      <th className="rounded-l-xl border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Peran</th>
                      <th className="border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Izin akses</th>
                      <th className="border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Ringkasan</th>
                      <th className="rounded-r-xl border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Aksi</th>
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
                          <td className="border border-line px-4 py-4 align-top">
                            <PillList emptyLabel="Belum ada izin akses" items={(role.permissions ?? []).map((permission) => permission.name)} />
                          </td>
                          <td className="border border-line px-4 py-4 align-top text-muted">
                            {role.users_count ?? 0} pengguna • {role.permissions_count ?? 0} izin akses
                          </td>
                          <td className="border border-line px-4 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link aria-label={`Ubah ${role.name}`} href={`/app/roles/${role.id}/edit`}>
                                  Ubah
                                </Link>
                              </Button>
                              <form action={deleteAction}>
                                <Button aria-label={`Hapus ${role.name}`} size="sm" type="submit" variant="destructive">
                                  Hapus
                                </Button>
                              </form>
                            </div>
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
