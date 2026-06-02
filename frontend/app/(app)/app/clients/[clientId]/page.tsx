import Link from "next/link"

import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { EmptyStateCard, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getClient } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageRouteParams, type PageSearchParams } from "@/lib/access-management/page"

const statusMessages = {
  updated: "Data klien berhasil diperbarui.",
}

const pillClassName = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"

const contractStatusLabels: Record<string, string> = {
  active: "Aktif",
  cancelled: "Dibatalkan",
  completed: "Selesai",
  draft: "Draft",
  expired: "Kedaluwarsa",
  terminated: "Dihentikan",
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-"
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(parsedDate)
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

function ClientStatusPill({ status }: { status: string }) {
  const isActive = status === "active"

  return (
    <span className={`${pillClassName} ${isActive ? "border-primary/20 bg-primary/10 text-primary" : "border-line bg-card-strong text-muted"}`}>
      {isActive ? "Aktif" : "Tidak aktif"}
    </span>
  )
}

function ContractStatusPill({ status }: { status: string }) {
  const palette =
    status === "active"
      ? "border-primary/20 bg-primary/10 text-primary"
      : status === "completed"
        ? "border-highlight/20 bg-accent-soft text-secondary-foreground"
        : status === "terminated" || status === "cancelled"
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-line bg-card-strong text-muted"

  return <span className={`${pillClassName} ${palette}`}>{contractStatusLabels[status] ?? status}</span>
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-line bg-card-strong px-4 py-4">
      <p className="text-xs font-mono uppercase tracking-[0.18em] text-highlight">{label}</p>
      <p className="text-sm leading-6 text-foreground">{value || "-"}</p>
    </div>
  )
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: PageRouteParams<{ clientId: string }>
  searchParams: PageSearchParams
}) {
  const { clientId } = await params
  const resolvedSearchParams = await searchParams
  const error = readSearchParam(resolvedSearchParams, "error")
  const status = readSearchParam(resolvedSearchParams, "status")

  let client = null
  let message: string | null = null

  try {
    client = await getClient(Number(clientId))
  } catch (fetchError) {
    message = handleModulePageError(fetchError)
  }

  if (!client) {
    return (
      <PageStack>
        <PageHeaderCard
          description="Detail klien tidak bisa dimuat. Periksa akses Anda atau kembali ke daftar klien."
          title="Detail klien"
        />
        <StatusToastBridge error={error ?? undefined} />
        <StatusBanner error={message ?? undefined} />
      </PageStack>
    )
  }

  const contracts = client.contracts ?? []
  const totalContracts = client.contracts_count ?? contracts.length
  const activeContractsCount =
    client.active_contracts_count ?? contracts.filter((contract) => contract.contract_status === "active").length
  const completedContractsCount = contracts.filter((contract) => contract.contract_status === "completed").length
  const otherContractsCount = Math.max(totalContracts - activeContractsCount - completedContractsCount, 0)
  const isInactive = client.status !== "active"
  const portalActive = Boolean(client.portal_access_enabled)

  return (
    <PageStack data-testid="client-detail-page">
      <PageHeaderCard
        actionHref={`/app/clients/${client.id}/edit`}
        actionLabel="Ubah klien"
        description="Tinjau identitas perusahaan, status operasional, kesiapan akses portal, dan kontrak yang terhubung dari satu halaman detail yang ringkas."
        title={`Detail klien: ${client.company_name}`}
      />
      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />
      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Status klien dan akses</CardTitle>
            <CardDescription>
              Tiga indikator di bawah ini bersifat <span className="font-medium">independen</span>: status data, akses portal, dan status kontrak dikelola secara terpisah.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-3xl border border-line bg-card-strong px-4 py-4">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-highlight">Status data klien</p>
            <ClientStatusPill status={client.status} />
            <p className="text-xs leading-5 text-muted">
              {isInactive
                ? "Data klien diarsipkan dan tidak muncul di daftar utama. Ubah ke Aktif untuk menampilkannya kembali."
                : "Data klien aktif dan tampil pada daftar utama."}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-3xl border border-line bg-card-strong px-4 py-4">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-highlight">Akses portal</p>
            <span className={`${pillClassName} ${portalActive ? "border-highlight/20 bg-accent-soft text-secondary-foreground" : "border-line bg-background text-muted"}`}>
              {portalActive ? "Portal aktif" : "Portal tidak aktif"}
            </span>
            <p className="text-xs leading-5 text-muted">
              {portalActive
                ? "Klien punya akun login dan dapat mengakses portal untuk melihat kontrak serta mengunggah bukti pembayaran."
                : isInactive
                  ? "Portal otomatis dimatikan karena status klien Tidak aktif."
                  : "Klien tidak memiliki akun login. Semua interaksi ditangani langsung oleh tim internal."}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-3xl border border-line bg-card-strong px-4 py-4">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-highlight">Kontrak terhubung</p>
            <p className="text-2xl font-semibold text-foreground">{totalContracts}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-primary">
                Aktif: {activeContractsCount}
              </span>
              <span className="rounded-full border border-highlight/20 bg-accent-soft px-2.5 py-0.5 text-secondary-foreground">
                Selesai: {completedContractsCount}
              </span>
              {otherContractsCount > 0 ? (
                <span className="rounded-full border border-line bg-background px-2.5 py-0.5">
                  Lainnya: {otherContractsCount}
                </span>
              ) : null}
            </div>
            <p className="text-xs leading-5 text-muted">
              Status setiap kontrak dapat berbeda dengan status klien. Buka detail kontrak untuk mengelolanya.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Ringkasan klien</CardTitle>
            <CardDescription>Semua informasi utama perusahaan dirangkum di sini agar tim admin bisa mengecek identitas dan kontak tanpa membuka form edit.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <DetailField label="Kode klien" value={client.client_code} />
            <DetailField label="Nama perusahaan" value={client.company_name} />
            <DetailField label="Kontak utama" value={client.contact_person} />
            <DetailField label="Email" value={client.email} />
            <DetailField label="Telepon" value={client.phone} />
            <DetailField label="Alamat" value={client.address} />
          </div>

          <div className="rounded-3xl border border-line bg-card-strong px-4 py-4">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-highlight">Diperbarui</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{formatDate(client.updated_at ?? client.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      {contracts.length ? (
        <Card>
          <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl">Kontrak terkait</CardTitle>
              <CardDescription>Daftar ini membantu admin melihat kontrak yang terhubung ke klien ini tanpa pindah dulu ke modul kontrak.</CardDescription>
            </div>

            <Link className={buttonVariants({ size: "sm", variant: "outline" })} href="/app/contracts">
              Buka daftar kontrak
            </Link>
          </CardHeader>

          <CardContent>
            <div className="overflow-hidden rounded-3xl border border-line">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      <th className="w-[18%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Nomor</th>
                      <th className="w-[32%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Kontrak</th>
                      <th className="w-[20%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Proyek</th>
                      <th className="w-[14%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Status</th>
                      <th className="w-[16%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract) => (
                    <tr key={contract.id}>
                      <td className="border border-line px-4 py-3.5 align-top font-medium text-foreground">{contract.contract_number}</td>
                      <td className="border border-line px-4 py-3.5 align-top">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-foreground">{contract.contract_title}</p>
                          <p className="text-xs text-muted">{formatDate(contract.contract_date)} • {formatCurrency(contract.contract_value)}</p>
                        </div>
                      </td>
                      <td className="border border-line px-4 py-3.5 align-top text-muted">{contract.project_name}</td>
                      <td className="border border-line px-4 py-3.5 align-top">
                        <ContractStatusPill status={contract.contract_status} />
                      </td>
                      <td className="border border-line px-4 py-3.5 align-top">
                        <div className="flex flex-wrap gap-2">
                          <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={`/app/contracts/${contract.id}`}>
                            Detail
                          </Link>
                          <Link className={buttonVariants({ size: "sm", variant: "secondary" })} href={`/app/contracts/${contract.id}/documents`}>
                            Dokumen
                          </Link>
                        </div>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyStateCard
          description="Klien ini belum memiliki kontrak yang tampil di frontend. Tambahkan kontrak baru dari modul kontrak bila diperlukan."
          title="Belum ada kontrak terkait"
        />
      )}
    </PageStack>
  )
}
