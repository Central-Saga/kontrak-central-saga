import Link from "next/link"
import { FileTextIcon, GitCompareArrowsIcon, HistoryIcon, PencilIcon } from "lucide-react"

import { ContractStatusBadge } from "@/components/access-management/entity-status-badge"
import { BackLinkButton, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getContract } from "@/lib/access-management/backend"
import { handleModulePageError, type PageRouteParams } from "@/lib/access-management/page"

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
}: {
  params: PageRouteParams<{ contractId: string }>
}) {
  const { contractId } = await params

  let contract = null
  let message: string | null = null

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

  return (
    <PageStack data-testid="contract-detail-page">
      <PageHeaderCard
        actionHref={`/app/contracts/${contract.id}/edit`}
        actionLabel="Ubah kontrak"
        description="Halaman detail ini memusatkan konteks kontrak, proyek, dan arsip dokumen."
        eyebrow="Manajemen kontrak"
        title={contract.contract_number}
      />

      <div className="flex flex-wrap items-center gap-3">
        <BackLinkButton href="/app/contracts" />
        <ContractStatusBadge status={contract.contract_status} />
        <span className="rounded-full border border-line bg-card-strong px-3 py-1 text-xs font-medium text-foreground">
          {contract.client?.company_name ?? "Klien belum tersedia"}
        </span>
      </div>

      <StatusBanner error={message ?? undefined} />

      <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-card-strong p-2">
        <Link
          href={`/app/contracts/${contract.id}`}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            "ring-primary/20 ring-[3px] bg-primary text-primary-foreground"
          }`}
        >
          Detail
        </Link>
        <Link
          href={`/app/contracts/${contract.id}/documents`}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground`}
        >
          <FileTextIcon className="h-4 w-4" />
          Dokumen
          {documentVersionsCount > 0 && (
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs">
              {documentVersionsCount}
            </span>
          )}
        </Link>
        <Link
          href={`/app/contracts/${contract.id}/compare`}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground`}
        >
          <GitCompareArrowsIcon className="h-4 w-4" />
          Komparasi
        </Link>
        <Link
          href={`/app/contracts/${contract.id}/history`}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground`}
        >
          <HistoryIcon className="h-4 w-4" />
          Riwayat
        </Link>
      </div>

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
            <p className="mt-2 text-sm leading-7 text-foreground">{contract.project_scope || "-"}</p>
          </div>
          <div className="rounded-2xl border border-line bg-card-strong px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Catatan</p>
            <p className="mt-2 text-sm leading-7 text-foreground">{contract.notes || "-"}</p>
          </div>
        </CardContent>
      </Card>

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
              Kelola Dokumen
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
    </PageStack>
  )
}
