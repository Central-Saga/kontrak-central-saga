import { ChevronDownIcon, GitCompareArrowsIcon, HistoryIcon } from "lucide-react"

import { deleteContractAction } from "@/app/(app)/app/access-management/actions"
import { ContractStatusBadge } from "@/components/access-management/entity-status-badge"
import { RowActionButtons } from "@/components/access-management/row-action-buttons"
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { EmptyStateCard, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { listClients, listContracts } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page"

const toolbarSelectClassName =
  "h-11 w-full appearance-none rounded-2xl border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

const statusMessages = {
  created: "Kontrak baru berhasil ditambahkan.",
  updated: "Data kontrak berhasil diperbarui.",
  deleted: "Kontrak berhasil dihapus.",
}

export default async function ContractsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams
  const search = readSearchParam(resolvedSearchParams, "search") ?? ""
  const statusFilter = readSearchParam(resolvedSearchParams, "contract_status") ?? ""
  const clientId = Number(readSearchParam(resolvedSearchParams, "client_id") ?? "") || undefined
  const status = readSearchParam(resolvedSearchParams, "status")
  const error = readSearchParam(resolvedSearchParams, "error")

  let contracts = null
  let clients = [] as Awaited<ReturnType<typeof listClients>>["data"]
  let message: string | null = null

  try {
    const [contractsResponse, clientsResponse] = await Promise.all([
      listContracts({ clientId, search, status: statusFilter || undefined }),
      listClients({ perPage: 100 }),
    ])
    contracts = contractsResponse
    clients = clientsResponse.data
  } catch (fetchError) {
    message = handleModulePageError(fetchError)
  }

  return (
    <PageStack data-testid="contracts-list-page">
      <PageHeaderCard
        actionHref="/app/contracts/new"
        actionLabel="Tambah kontrak"
        description="Kelola kontrak dari daftar yang lebih ringkas, lalu buka halaman detail untuk melihat konteks bisnis dan dokumennya."
        title="Kelola kontrak"
        eyebrow="Manajemen kontrak"
      />

      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />
      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Daftar kontrak</CardTitle>
            <CardDescription>
              Daftar difokuskan ke identitas inti dan status. Detail proyek, nilai, catatan, serta konteks dokumen dipindah ke halaman detail kontrak.
            </CardDescription>
          </div>

          <form className="flex w-full flex-col gap-3 xl:flex-row" method="GET">
            <Input data-testid="contracts-search-input" defaultValue={search} name="search" placeholder="Cari nomor, judul, atau nama proyek" />
            <div className="relative w-full xl:max-w-56">
              <select className={toolbarSelectClassName} defaultValue={clientId ? String(clientId) : ""} name="client_id">
                <option value="">Semua klien</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.company_name}</option>
                ))}
              </select>
              <ChevronDownIcon aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
            </div>
            <div className="relative w-full xl:max-w-48">
              <select className={toolbarSelectClassName} defaultValue={statusFilter} name="contract_status">
                <option value="">Semua status</option>
                <option value="draft">Draft</option>
                <option value="active">Aktif</option>
                <option value="completed">Selesai</option>
                <option value="terminated">Dihentikan</option>
                <option value="expired">Kedaluwarsa</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
              <ChevronDownIcon aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
            </div>
            <button className="h-11 rounded-2xl border border-line px-4 text-sm font-medium text-foreground" type="submit">Cari</button>
          </form>

          <Alert>
            <AlertTitle>Riwayat versi dokumen tersedia di setiap kontrak</AlertTitle>
            <AlertDescription>
              Gunakan ikon riwayat dokumen pada tabel untuk langsung menuju arsip versi, unggah revisi baru, atau compare metadata antarversi di halaman ubah kontrak.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          {contracts && contracts.data.length > 0 ? (
            <div className="overflow-hidden rounded-3xl border border-line">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      <th className="w-[16%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Nomor</th>
                      <th className="w-[20%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Klien</th>
                      <th className="w-[30%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Judul</th>
                      <th className="w-[14%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Status</th>
                      <th className="w-[10%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Dokumen</th>
                      <th className="w-[12rem] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.data.map((contract) => {
                      const deleteAction = deleteContractAction.bind(null, contract.id)
                      const documentVersionsCount = contract.document_versions_count ?? contract.document_versions?.length ?? 0
                      const compareReady = documentVersionsCount >= 2
                      const documentHistoryHref = `/app/contracts/${contract.id}/edit#contract-document-history`

                      return (
                        <tr key={contract.id}>
                          <td className="border border-line px-4 py-3.5 align-top font-medium text-foreground">{contract.contract_number}</td>
                          <td className="border border-line px-4 py-3.5 align-top text-muted">{contract.client?.company_name ?? "-"}</td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <div className="flex flex-col gap-1">
                              <p className="font-medium text-foreground">{contract.contract_title}</p>
                              <p className="text-xs text-muted">{contract.project_name}</p>
                            </div>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <ContractStatusBadge status={contract.contract_status} />
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex w-fit items-center rounded-full border border-line bg-card-strong px-2.5 py-1 text-xs font-medium text-foreground">
                                <HistoryIcon aria-hidden className="mr-1 size-3.5" />
                                {documentVersionsCount} versi
                              </span>
                              <span className={[
                                "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                                compareReady ? "border-primary/20 bg-primary/10 text-primary" : "border-line bg-card-strong text-muted",
                              ].join(" ")}>
                                <GitCompareArrowsIcon aria-hidden className="mr-1 size-3.5" />
                                {compareReady ? "Compare siap" : "Compare nanti"}
                              </span>
                            </div>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <RowActionButtons
                              deleteAction={deleteAction}
                              deleteLabel={`Hapus ${contract.contract_number}`}
                              deleteTestId={`contract-delete-${contract.id}`}
                              editHref={`/app/contracts/${contract.id}/edit`}
                              editLabel={`Ubah ${contract.contract_number}`}
                              editTestId={`contract-edit-${contract.id}`}
                              historyHref={documentHistoryHref}
                              historyLabel={`Buka riwayat dokumen ${contract.contract_number}`}
                              historyTestId={`contract-history-${contract.id}`}
                              viewHref={`/app/contracts/${contract.id}`}
                              viewLabel={`Lihat detail ${contract.contract_number}`}
                              viewTestId={`contract-view-${contract.id}`}
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
            <EmptyStateCard description="Ubah filter pencarian atau tambahkan kontrak baru bila belum tersedia." title="Belum ada kontrak yang cocok" />
          )}
        </CardContent>
      </Card>
    </PageStack>
  )
}
