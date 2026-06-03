import Link from "next/link"
import { FileTextIcon, GitCompareArrowsIcon, HistoryIcon } from "lucide-react"

import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { ContractStatusBadge } from "@/components/access-management/entity-status-badge"
import { BackLinkButton, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { ContractOperationsSections, type ContractOperationsPermissions } from "@/components/contract-management/contract-operations-sections"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getContract } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageRouteParams, type PageSearchParams } from "@/lib/access-management/page"
import { hasAnyPermission } from "@/lib/auth/permissions"
import { readSessionState } from "@/lib/auth/session"
import type { AuthUser } from "@/lib/auth/types"

const statusMessages = {
  payment_term_created: "Termin pembayaran baru berhasil ditambahkan.",
  payment_term_updated: "Termin pembayaran berhasil diperbarui.",
  payment_term_deleted: "Termin pembayaran berhasil dihapus.",
  payment_created: "Pembayaran baru berhasil dicatat.",
  payment_updated: "Data pembayaran berhasil diperbarui.",
  payment_deleted: "Data pembayaran berhasil dihapus.",
  payment_proof_uploaded: "Bukti pembayaran berhasil diunggah untuk proses verifikasi.",
  project_progress_created: "Update progres proyek berhasil ditambahkan.",
  project_progress_updated: "Update progres proyek berhasil diperbarui.",
  project_progress_deleted: "Update progres proyek berhasil dihapus.",
  payment_reminder_sent: "Pengingat pembayaran berhasil dikirim ke email klien.",
  progress_reminder_sent: "Pengingat progres proyek berhasil dikirim ke email klien.",
} satisfies Record<string, string>

const versionStatusLabels: Record<string, string> = {
  draft: "Draft",
  final: "Final",
  review: "Review",
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date)
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

function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value

  if (Number.isNaN(amount)) {
    return String(value)
  }

  return new Intl.NumberFormat("id-ID", {
    currency: "IDR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount)
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function shouldShowPaymentTermDueAlert(term: { due_date: string; status: string }): boolean {
  const days = getDaysUntil(term.due_date)

  return days <= 30 && !["paid", "cancelled"].includes(term.status)
}

function formatDueDateAlert(dateStr: string, label: string): { message: string; variant: "default" | "destructive" | "warning" } | null {
  const days = getDaysUntil(dateStr)
  if (days < 0) {
    return { message: `${label} sudah lewat ${Math.abs(days)} hari yang lalu.`, variant: "destructive" }
  }
  if (days === 0) {
    return { message: `${label} hari ini.`, variant: "destructive" }
  }
  if (days <= 7) {
    return { message: `${label} tinggal ${days} hari lagi.`, variant: "warning" }
  }
  if (days <= 30) {
    return { message: `${label} tinggal ${days} hari lagi.`, variant: "default" }
  }
  return null
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-card-strong px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="text-sm leading-6 text-foreground">{value}</p>
    </div>
  )
}

export default async function ContractDetailPage({
  params,
  searchParams,
}: {
  params: PageRouteParams<{ contractId: string }>
  searchParams: PageSearchParams
}) {
  const { contractId } = await params
  const resolvedSearchParams = await searchParams
  const status = readSearchParam(resolvedSearchParams, "status")
  const error = readSearchParam(resolvedSearchParams, "error")

  const session = await readSessionState()
  const user: AuthUser | null = session.status === "authenticated" ? session.user : null
  const canManageContracts = user ? hasAnyPermission(user, ["manage contracts"]) : false
  const canUpdateContracts = user ? hasAnyPermission(user, ["manage contracts", "update contracts"]) : false
  const canViewDocuments = user ? hasAnyPermission(user, ["manage contracts", "read contracts"]) : false
  const operationsPermissions: ContractOperationsPermissions = {
    canCreatePaymentTerms: user ? hasAnyPermission(user, ["manage payment terms", "create payment terms"]) : false,
    canUpdatePaymentTerms: user ? hasAnyPermission(user, ["manage payment terms", "update payment terms"]) : false,
    canDeletePaymentTerms: user ? hasAnyPermission(user, ["manage payment terms", "delete payment terms"]) : false,
    canCreatePayments: user ? hasAnyPermission(user, ["manage payments", "create payments"]) : false,
    canUpdatePayments: user ? hasAnyPermission(user, ["manage payments", "update payments", "verification payments"]) : false,
    canDeletePayments: user ? hasAnyPermission(user, ["manage payments", "delete payments"]) : false,
    canCreateProgress: user ? hasAnyPermission(user, ["manage project progress", "create project progress"]) : false,
    canUpdateProgress: user ? hasAnyPermission(user, ["manage project progress", "update project progress"]) : false,
    canDeleteProgress: user ? hasAnyPermission(user, ["manage project progress", "delete project progress"]) : false,
    canUploadPaymentProof: user ? hasAnyPermission(user, ["manage payments", "upload payment proofs", "create payment proofs"]) : false,
  }

  let contract = null
  let message: string | null = error ?? null

  try {
    contract = await getContract(Number(contractId))
  } catch (fetchError) {
    message = handleModulePageError(fetchError)
  }

  if (!contract) {
    return (
      <PageStack>
        <PageHeaderCard
          description="Detail kontrak tidak bisa dimuat. Periksa akses Anda atau kembali ke daftar kontrak."
          eyebrow="Manajemen kontrak"
          title="Detail kontrak"
        />
        <StatusToastBridge error={error ?? undefined} />
        <StatusBanner error={message ?? undefined} />
      </PageStack>
    )
  }

  const documentVersionsCount = contract.document_versions_count ?? 0
  const latestDocumentVersion = contract.latest_document_version
  const latestDocumentSummary = latestDocumentVersion
    ? [
        `V${String(latestDocumentVersion.version_number).padStart(2, "0")}`,
        versionStatusLabels[latestDocumentVersion.version_status] ?? latestDocumentVersion.version_status,
        formatDateTime(latestDocumentVersion.uploaded_at ?? latestDocumentVersion.created_at) ?? "Belum tercatat",
      ].join(" • ")
    : "Belum ada arsip dokumen."

  const latestProgress = contract.latest_progress

  return (
    <PageStack data-testid="contract-detail-page">
      <PageHeaderCard
        actionHref={canUpdateContracts ? `/app/contracts/${contract.id}/edit` : undefined}
        actionLabel={canUpdateContracts ? "Ubah kontrak" : undefined}
        description="Halaman detail ini memusatkan konteks kontrak, proyek, arsip dokumen, dan seluruh operasi pembayaran di satu alur kerja."
        eyebrow="Manajemen kontrak"
        title={contract.contract_number}
      />

      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />

      <div className="flex flex-wrap items-center gap-3">
        <BackLinkButton href="/app/contracts" />
        <ContractStatusBadge status={contract.contract_status} />
        <span className="rounded-full border border-line bg-card-strong px-3 py-1 text-xs font-medium text-foreground">
          {contract.client?.company_name ?? "Klien belum tersedia"}
        </span>
      </div>

      <StatusBanner error={message ?? undefined} messages={statusMessages} status={status} />

      <Tabs defaultValue="summary" className="gap-4">
        <TabsList className="bg-card-strong border border-line">
          <TabsTrigger value="summary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ringkasan</TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Operasional</TabsTrigger>
          {canViewDocuments ? <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Dokumen</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="summary" className="flex flex-col gap-4">

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ringkasan kontrak</CardTitle>
          <CardDescription>Informasi inti kontrak dan proyek disusun dalam blok yang lebih mudah dibaca.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Nomor kontrak" value={contract.contract_number} />
          <DetailItem label="Judul kontrak" value={contract.contract_title} />
          <DetailItem label="Klien" value={contract.client?.company_name ?? "-"} />
          <DetailItem label="Nama proyek" value={contract.project_name} />
          <DetailItem label="Nilai kontrak" value={formatCurrency(contract.contract_value)} />
          <DetailItem label="Tanggal kontrak" value={formatDate(contract.contract_date)} />
          <DetailItem label="Mulai kerja" value={formatDate(contract.start_date)} />
          <DetailItem label="Selesai kerja" value={formatDate(contract.end_date)} />
          <DetailItem label="Skema pembayaran" value={contract.payment_scheme_summary || "-"} />
        </CardContent>
      </Card>

      {contract.end_date && (() => {
        const alert = formatDueDateAlert(contract.end_date, "Selesai kerja")
        return alert ? (
          <Alert variant={alert.variant} className="animate-pulse">
            <AlertTitle>Notifikasi Jatuh Tempo</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        ) : null
      })()}

      {contract.payment_terms?.length ? (() => {
        const overdueTerms = contract.payment_terms
          .filter(shouldShowPaymentTermDueAlert)
          .sort((first, second) => {
            const firstDue = new Date(first.due_date).getTime()
            const secondDue = new Date(second.due_date).getTime()

            if (firstDue !== secondDue) {
              return firstDue - secondDue
            }

            return first.term_number - second.term_number
          })

        return overdueTerms.length ? (
          <Alert variant="warning">
            <AlertTitle>Termin Mendekati / Melewati Jatuh Tempo</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {overdueTerms.map((term) => {
                  const days = getDaysUntil(term.due_date)
                  const isOverdue = days < 0
                  const isToday = days === 0
                  return (
                    <li key={term.id} className={isOverdue || isToday ? "font-medium text-destructive" : ""}>
                      Termin {term.term_number} — {term.term_title}: jatuh tempo {formatDate(term.due_date)} ({isOverdue ? `terlambat ${Math.abs(days)} hari` : isToday ? "hari ini" : `${days} hari lagi`}) — {formatCurrency(term.amount)}
                    </li>
                  )
                })}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null
      })() : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ruang lingkup dan catatan</CardTitle>
          <CardDescription>
            Bagian ini memisahkan informasi naratif dari tabel daftar agar fokus daftar tetap terjaga.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-card-strong px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Ruang lingkup proyek</p>
            <div
              className="prose prose-sm mt-2 max-w-none text-sm leading-7 text-foreground"
              dangerouslySetInnerHTML={{ __html: contract.project_scope || "<p>-</p>" }}
            />
          </div>
          <div className="rounded-2xl border border-line bg-card-strong px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Catatan</p>
            <p className="mt-2 text-sm leading-7 text-foreground">{contract.notes || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ringkasan operasional kontrak</CardTitle>
          <CardDescription>Panel ini merangkum progres terbaru, jumlah termin, dan aktivitas pembayaran langsung dari kontrak.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <DetailItem label="Jumlah termin" value={String(contract.payment_terms_count ?? contract.payment_terms?.length ?? 0)} />
            <DetailItem label="Jumlah update progres" value={String(contract.project_progress_updates_count ?? contract.project_progress?.length ?? 0)} />
            <DetailItem label="Progres terbaru" value={latestProgress ? `${latestProgress.percentage}% • ${latestProgress.progress_title}` : "Belum ada laporan progres"} />
          </div>

          {latestProgress ? (
            <div className="rounded-2xl border border-line bg-card-strong px-4 py-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted">Visualisasi progres terbaru</p>
              <ProgressBar
                label={latestProgress.progress_title}
                size="lg"
                value={Number(latestProgress.percentage) || 0}
                variant={latestProgress.status as never}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="operations" className="flex flex-col gap-4">
          <ContractOperationsSections contract={contract} permissions={operationsPermissions} />
        </TabsContent>

        {canViewDocuments ? (
          <TabsContent value="documents" className="flex flex-col gap-4">
            <Alert>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-1">
                  <AlertTitle>Arsip dokumen kontrak</AlertTitle>
                  <AlertDescription>
                    {documentVersionsCount > 0
                      ? `Saat ini tersedia ${documentVersionsCount} versi dokumen. Versi terbaru ${latestDocumentSummary}.`
                      : "Belum ada versi dokumen yang tersimpan untuk kontrak ini."}
                  </AlertDescription>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link className={buttonVariants({ variant: "outline" })} href={`/app/contracts/${contract.id}/documents`}>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    {canManageContracts ? "Kelola Dokumen" : "Lihat Dokumen"}
                  </Link>
                  <Link className={buttonVariants({ variant: "outline" })} href={`/app/contracts/${contract.id}/compare`}>
                    <GitCompareArrowsIcon className="mr-2 h-4 w-4" />
                    Komparasi
                  </Link>
                  <Link className={buttonVariants({ variant: "outline" })} href={`/app/contracts/${contract.id}/history`}>
                    <HistoryIcon className="mr-2 h-4 w-4" />
                    Riwayat
                  </Link>
                </div>
              </div>
            </Alert>
          </TabsContent>
        ) : null}
      </Tabs>

    </PageStack>
  )
}
