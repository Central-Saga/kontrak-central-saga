import Link from "next/link"
import { ChevronDownIcon, GitCompareArrowsIcon, HistoryIcon } from "lucide-react"

import { deleteContractAction } from "@/app/(app)/app/access-management/actions"
import { RowActionButtons } from "@/components/access-management/row-action-buttons"
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { EmptyStateCard, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { buttonVariants } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { listClients, listContracts, type ContractRecord } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page"

const toolbarSelectClassName =
  "h-11 w-full appearance-none rounded-2xl border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

const statusMessages = {
  created: "Kontrak baru berhasil ditambahkan.",
  updated: "Data kontrak berhasil diperbarui.",
  deleted: "Kontrak berhasil dihapus.",
}

const versionStatusLabels: Record<string, string> = {
  draft: "Draft",
  final: "Final",
  review: "Review",
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function getLatestDocumentVersionSummary(contract: ContractRecord) {
  const latestVersion = contract.latest_document_version

  if (!latestVersion) {
    return null
  }

  return [
    `V${String(latestVersion.version_number).padStart(2, "0")}`,
    versionStatusLabels[latestVersion.version_status] ?? latestVersion.version_status,
    formatDateTime(latestVersion.uploaded_at ?? latestVersion.created_at) ?? "Belum tercatat",
  ].join(" • ")
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
        description="Kelola daftar kontrak, status proyek, serta akses cepat ke riwayat dokumen dan compare metadata dari satu halaman ringkas."
        title="Kelola kontrak"
      />

      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />
      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Daftar kontrak</CardTitle>
            <CardDescription>
              Cari berdasarkan nomor kontrak, proyek, atau judul, lalu buka halaman ubah untuk memperbarui detail kontrak, mengelola arsip versi dokumen, dan membandingkan dua versi metadata.
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
                      <th className="w-[14%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Nomor</th>
                      <th className="w-[17%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Klien</th>
                      <th className="w-[29%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Judul & dokumen</th>
                      <th className="w-[11%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Proyek</th>
                      <th className="w-[11%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Nilai</th>
                      <th className="w-[8%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Status</th>
                      <th className="w-[10rem] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.data.map((contract) => {
                      const deleteAction = deleteContractAction.bind(null, contract.id)
                      const documentVersionsCount = contract.document_versions_count ?? contract.document_versions?.length ?? 0
                      const latestDocumentVersionSummary = getLatestDocumentVersionSummary(contract)
                      const compareReady = documentVersionsCount >= 2
                      const documentHistoryHref = `/app/contracts/${contract.id}/edit#contract-document-history`

                      return (
                        <tr key={contract.id}>
                          <td className="border border-line px-4 py-3.5 align-top font-medium text-foreground">{contract.contract_number}</td>
                          <td className="border border-line px-4 py-3.5 align-top text-muted">{contract.client?.company_name ?? "-"}</td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <div className="flex flex-col gap-2.5">
                              <div className="flex flex-col gap-1">
                                <p className="font-medium text-foreground">{contract.contract_title}</p>
                              </div>

                              <div className="flex flex-col gap-2 rounded-2xl border border-line bg-background px-3 py-2.5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full border border-line bg-card-strong px-2.5 py-1 text-xs font-medium text-foreground">
                                      <HistoryIcon aria-hidden className="mr-1 size-3.5" />
                                      {documentVersionsCount} versi
                                    </span>
                                    <span className={[
                                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                                      compareReady ? "border-primary/20 bg-primary/10 text-primary" : "border-line bg-card-strong text-muted",
                                    ].join(" ")}>
                                      <GitCompareArrowsIcon aria-hidden className="mr-1 size-3.5" />
                                      {compareReady ? "Compare siap" : "Compare nanti"}
                                    </span>
                                  </div>

                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Link
                                          aria-label={`Buka riwayat dokumen ${contract.contract_number}`}
                                          className={buttonVariants({ size: "icon-xs", variant: "outline" })}
                                          href={documentHistoryHref}
                                        >
                                          <HistoryIcon aria-hidden data-icon="inline-start" />
                                        </Link>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">Riwayat dokumen</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <p className="text-xs leading-5 text-muted">
                                  {latestDocumentVersionSummary ? latestDocumentVersionSummary : "Belum ada arsip dokumen."}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top text-muted">{contract.project_name}</td>
                          <td className="border border-line px-4 py-3.5 align-top text-muted">{contract.contract_value}</td>
                          <td className="border border-line px-4 py-3.5 align-top text-muted">{contract.contract_status}</td>
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
