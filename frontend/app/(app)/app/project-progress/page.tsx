import Link from "next/link"
import { EyeIcon, Trash2Icon } from "lucide-react"

import { DeleteConfirmationDialog } from "@/components/access-management/delete-confirmation-dialog"
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { EmptyStateCard, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  deleteProjectProgressStandaloneAction,
} from "@/app/(app)/app/access-management/actions"
import { listContracts, listProjectProgress, type ProjectProgressRecord } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page"
import { hasAnyPermission } from "@/lib/auth/permissions"
import { readSessionState } from "@/lib/auth/session"
import type { AuthUser } from "@/lib/auth/types"

const statusMessages = {
  project_progress_created: "Update progres proyek berhasil ditambahkan.",
  project_progress_updated: "Update progres proyek berhasil diperbarui.",
  project_progress_deleted: "Update progres proyek berhasil dihapus.",
}

const progressStatusLabels: Record<string, string> = {
  not_started: "Belum mulai",
  in_progress: "Berjalan",
  on_hold: "Tertahan",
  delayed: "Terlambat",
  completed: "Selesai",
}

const statusPillClassName = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"

function ProgressStatusPill({ status }: { status: string }) {
  const palette =
    status === "completed"
      ? "border-primary/20 bg-primary/10 text-primary"
      : status === "in_progress"
        ? "border-highlight/20 bg-accent-soft text-secondary-foreground"
        : status === "delayed" || status === "on_hold"
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-line bg-card-strong text-muted"

  return <span className={`${statusPillClassName} ${palette}`}>{progressStatusLabels[status] ?? status}</span>
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date)
}

export default async function ProjectProgressPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams
  const status = readSearchParam(resolvedSearchParams, "status")
  const error = readSearchParam(resolvedSearchParams, "error")

  const session = await readSessionState()
  const user: AuthUser | null = session.status === "authenticated" ? session.user : null
  const canCreate = user ? hasAnyPermission(user, ["manage project progress", "create project progress"]) : false
  const canDelete = user ? hasAnyPermission(user, ["manage project progress", "delete project progress"]) : false

  let progressItems = null
  let contracts = [] as Awaited<ReturnType<typeof listContracts>>["data"]
  let message: string | null = null

  try {
    const [progressResponse, contractsResponse] = await Promise.all([
      listProjectProgress({ perPage: 100 }),
      listContracts({ perPage: 100 }),
    ])
    progressItems = progressResponse
    contracts = contractsResponse.data
  } catch (fetchError) {
    message = handleModulePageError(fetchError)
  }

  const contractMap = new Map(contracts.map((c) => [c.id, c]))

  return (
    <PageStack data-testid="project-progress-list-page">
      <PageHeaderCard
        actionHref={canCreate ? "/app/project-progress/new" : undefined}
        actionLabel={canCreate ? "Tambah progres" : undefined}
        description="Pantau perkembangan proyek dari seluruh kontrak dalam satu daftar terpusat."
        title="Kelola progres proyek"
        eyebrow="Manajemen progres"
      />

      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />
      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Daftar progres proyek</CardTitle>
            <CardDescription>
              Update progres dari seluruh kontrak dalam satu tabel agar tim proyek bisa memantau kondisi eksekusi.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {progressItems && progressItems.data.length > 0 ? (
            <div className="overflow-hidden rounded-3xl border border-line">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      <th className="w-[15%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Kontrak</th>
                      <th className="w-[12%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Tanggal</th>
                      <th className="w-[22%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Judul Progres</th>
                      <th className="w-[10%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Persentase</th>
                      <th className="w-[12%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Status</th>
                      <th className="w-[29%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressItems.data.map((progress: ProjectProgressRecord) => {
                      const deleteAction = deleteProjectProgressStandaloneAction.bind(null, progress.id)
                      const contract = contractMap.get(progress.contract_id)

                      return (
                        <tr key={progress.id}>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <div className="flex flex-col gap-1">
                              <p className="font-medium text-foreground">{contract?.contract_number ?? `Kontrak #${progress.contract_id}`}</p>
                              <p className="text-xs text-muted">{contract?.contract_title ?? "-"}</p>
                            </div>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <p className="text-sm text-foreground">{formatDate(progress.progress_date)}</p>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <p className="font-medium text-foreground">{progress.progress_title}</p>
                            <p className="text-xs text-muted line-clamp-2">{progress.progress_description}</p>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{progress.percentage}%</span>
                            </div>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <ProgressStatusPill status={progress.status} />
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <div className="flex flex-nowrap items-center gap-2">
                              <Link
                                aria-label={`Lihat detail kontrak ${contract?.contract_number ?? progress.contract_id}`}
                                className={buttonVariants({ size: "icon-sm", variant: "outline" })}
                                href={`/app/contracts/${progress.contract_id}`}
                              >
                                <EyeIcon aria-hidden data-icon="inline-start" />
                              </Link>
                              {canDelete ? (
                                <DeleteConfirmationDialog
                                  action={deleteAction}
                                  description="Update progres ini akan dihapus permanen."
                                  title="Hapus progres proyek?"
                                  tooltipLabel="Hapus progres"
                                >
                                  <Button aria-label={`Hapus progres ${progress.progress_title}`} size="icon-sm" type="button" variant="destructive">
                                    <Trash2Icon aria-hidden data-icon="inline-start" />
                                  </Button>
                                </DeleteConfirmationDialog>
                              ) : null}
                            </div>
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
              description="Update progres baru akan muncul di sini setelah dibuat dari halaman detail kontrak."
              title="Belum ada progres proyek"
            />
          )}
        </CardContent>
      </Card>
    </PageStack>
  )
}
