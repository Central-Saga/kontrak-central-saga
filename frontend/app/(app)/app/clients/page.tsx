import { deleteClientAction } from "@/app/(app)/app/access-management/actions"
import { RowActionButtons } from "@/components/access-management/row-action-buttons"
import { EmptyStateCard, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { listClients } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page"

const statusMessages = {
  created: "Klien baru berhasil ditambahkan.",
  updated: "Data klien berhasil diperbarui.",
  deleted: "Klien berhasil dihapus.",
}

export default async function ClientsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams
  const search = readSearchParam(resolvedSearchParams, "search") ?? ""
  const statusFilter = readSearchParam(resolvedSearchParams, "status") ?? ""
  const status = readSearchParam(resolvedSearchParams, "status")
  const error = readSearchParam(resolvedSearchParams, "error")

  let clients = null
  let message: string | null = null

  try {
    clients = await listClients({ search, status: statusFilter || undefined })
  } catch (fetchError) {
    message = handleModulePageError(fetchError)
  }

  return (
    <PageStack data-testid="clients-list-page">
      <PageHeaderCard
        actionHref="/app/clients/new"
        actionLabel="Tambah klien"
        description="Kelola identitas perusahaan, kontak utama, dan kesiapan akses portal dari satu halaman terpisah yang rapi."
        title="Kelola klien"
      />

      <StatusBanner error={error ?? message ?? undefined} messages={statusMessages} status={status} />

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Daftar klien</CardTitle>
            <CardDescription>Cari berdasarkan kode atau nama perusahaan, lalu buka halaman ubah untuk memperbarui detailnya.</CardDescription>
          </div>

          <form className="flex w-full flex-col gap-3 sm:flex-row" method="GET">
            <Input data-testid="clients-search-input" defaultValue={search} name="search" placeholder="Cari kode atau nama klien" />
            <select
              className="flex h-11 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:max-w-48"
              defaultValue={statusFilter}
              name="status"
            >
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak aktif</option>
            </select>
            <button className="h-11 rounded-2xl border border-line px-4 text-sm font-medium text-foreground" type="submit">Cari</button>
          </form>
        </CardHeader>

        <CardContent>
          {clients && clients.data.length > 0 ? (
            <div className="overflow-hidden rounded-3xl border border-line">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      <th className="w-[14%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Kode</th>
                      <th className="w-[24%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Perusahaan</th>
                      <th className="w-[18%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Kontak</th>
                      <th className="w-[20%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Email</th>
                      <th className="w-[10%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Status</th>
                      <th className="w-[14%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.data.map((client) => {
                      const deleteAction = deleteClientAction.bind(null, client.id)
                      return (
                        <tr key={client.id}>
                          <td className="border border-line px-4 py-4 align-top font-medium text-foreground">{client.client_code}</td>
                          <td className="border border-line px-4 py-4 align-top">
                            <div className="flex flex-col gap-1">
                              <p className="font-medium text-foreground">{client.company_name}</p>
                              <p className="text-xs text-muted">{client.contracts_count ?? 0} kontrak • {client.active_contracts_count ?? 0} aktif</p>
                            </div>
                          </td>
                          <td className="border border-line px-4 py-4 align-top text-muted">{client.contact_person || "-"}</td>
                          <td className="border border-line px-4 py-4 align-top text-muted break-all">{client.email || "-"}</td>
                          <td className="border border-line px-4 py-4 align-top text-muted">{client.status === "active" ? "Aktif" : "Tidak aktif"}</td>
                          <td className="border border-line px-4 py-4 align-top">
                            <RowActionButtons
                              deleteAction={deleteAction}
                              deleteLabel={`Hapus ${client.company_name}`}
                              deleteTestId={`client-delete-${client.id}`}
                              editHref={`/app/clients/${client.id}/edit`}
                              editLabel={`Ubah ${client.company_name}`}
                              editTestId={`client-edit-${client.id}`}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyStateCard
              description="Ubah kata kunci pencarian atau tambahkan klien baru bila belum tersedia."
              title="Belum ada klien yang cocok"
            />
          )}
        </CardContent>
      </Card>
    </PageStack>
  )
}
