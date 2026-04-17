import { ChevronDownIcon } from "lucide-react"

import { deleteClientAction } from "@/app/(app)/app/access-management/actions"
import { ClientStatusBadge } from "@/components/access-management/entity-status-badge"
import { RowActionButtons } from "@/components/access-management/row-action-buttons"
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { EmptyStateCard, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { listClients } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page"

const toolbarSelectClassName =
  "h-11 w-full appearance-none rounded-2xl border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

const statusMessages = {
  created: "Klien baru berhasil ditambahkan.",
  updated: "Data klien berhasil diperbarui.",
  deleted: "Klien berhasil dihapus.",
}

export default async function ClientsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams
  const search = readSearchParam(resolvedSearchParams, "search") ?? ""
  const statusFilter = readSearchParam(resolvedSearchParams, "client_status") ?? ""
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
        description="Kelola klien dari daftar yang lebih ringkas, lalu buka halaman detail untuk melihat konteks lengkapnya."
        title="Kelola klien"
        eyebrow="Manajemen klien"
      />

      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />
      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Daftar klien</CardTitle>
            <CardDescription>
              Daftar difokuskan ke identitas inti. Detail kontak, alamat, dan konteks operasional dipindah ke halaman detail klien.
            </CardDescription>
          </div>

          <form className="flex w-full flex-col gap-3 sm:flex-row" method="GET">
            <Input data-testid="clients-search-input" defaultValue={search} name="search" placeholder="Cari kode atau nama klien" />
            <div className="relative w-full sm:max-w-48">
              <select className={toolbarSelectClassName} defaultValue={statusFilter} name="client_status">
                <option value="">Semua status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Tidak aktif</option>
              </select>
              <ChevronDownIcon aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
            </div>
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
                      <th className="w-[18%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Kode</th>
                      <th className="w-[42%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Perusahaan</th>
                      <th className="w-[18%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Status</th>
                      <th className="w-[14%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Portal</th>
                      <th className="w-[11rem] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.data.map((client) => {
                      const deleteAction = deleteClientAction.bind(null, client.id)
                      return (
                        <tr key={client.id}>
                          <td className="border border-line px-4 py-3.5 align-top font-medium text-foreground">{client.client_code}</td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <div className="flex flex-col gap-1">
                              <p className="font-medium text-foreground">{client.company_name}</p>
                              <p className="text-xs text-muted">
                                {client.contracts_count ?? 0} kontrak • {client.active_contracts_count ?? 0} aktif
                              </p>
                            </div>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <ClientStatusBadge status={client.status} />
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top text-muted">
                            {client.portal_access_enabled ? "Aktif" : "Nonaktif"}
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <RowActionButtons
                              deleteAction={deleteAction}
                              deleteLabel={`Hapus ${client.company_name}`}
                              deleteTestId={`client-delete-${client.id}`}
                              editHref={`/app/clients/${client.id}/edit`}
                              editLabel={`Ubah ${client.company_name}`}
                              editTestId={`client-edit-${client.id}`}
                              viewHref={`/app/clients/${client.id}`}
                              viewLabel={`Lihat detail ${client.company_name}`}
                              viewTestId={`client-view-${client.id}`}
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
