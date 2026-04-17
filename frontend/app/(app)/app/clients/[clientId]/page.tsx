import Link from "next/link"

import { ClientStatusBadge } from "@/components/access-management/entity-status-badge"
import { BackLinkButton, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { getClient } from "@/lib/access-management/backend"
import { handleModulePageError, type PageRouteParams } from "@/lib/access-management/page"

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

export default async function ClientDetailPage({
  params,
}: {
  params: PageRouteParams<{ clientId: string }>
}) {
  const { clientId } = await params

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
          eyebrow="Manajemen klien"
          title="Detail klien"
        />
        <StatusBanner error={message ?? undefined} />
      </PageStack>
    )
  }

  return (
    <PageStack data-testid="client-detail-page">
      <PageHeaderCard
        actionHref={`/app/clients/${client.id}/edit`}
        actionLabel="Ubah klien"
        description="Lihat identitas inti klien, kontak operasional, dan kesiapan portal dari halaman detail yang lebih fokus."
        eyebrow="Manajemen klien"
        title={client.company_name}
      />

      <div className="flex flex-wrap items-center gap-3">
        <BackLinkButton href="/app/clients" />
        <ClientStatusBadge status={client.status} />
        <span className="rounded-full border border-line bg-card-strong px-3 py-1 text-xs font-medium text-foreground">
          Portal {client.portal_access_enabled ? "aktif" : "nonaktif"}
        </span>
      </div>

      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ringkasan klien</CardTitle>
          <CardDescription>
            Informasi dasar klien dipisahkan dari halaman daftar supaya index tetap ringkas dan mudah dipindai.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Kode klien" value={client.client_code} />
          <DetailItem label="Perusahaan" value={client.company_name} />
          <DetailItem label="Kontak utama" value={client.contact_person || "-"} />
          <DetailItem label="Email" value={client.email || "-"} />
          <DetailItem label="Telepon" value={client.phone || "-"} />
          <DetailItem label="Alamat" value={client.address || "-"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Konteks operasional</CardTitle>
          <CardDescription>
            Gambaran singkat keterlibatan klien terhadap kontrak yang sudah berjalan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <DetailItem label="Jumlah kontrak" value={String(client.contracts_count ?? 0)} />
          <DetailItem label="Kontrak aktif" value={String(client.active_contracts_count ?? 0)} />
          <DetailItem label="Akses portal" value={client.portal_access_enabled ? "Diaktifkan" : "Belum diaktifkan"} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Link className={buttonVariants({ size: "lg" })} href={`/app/clients/${client.id}/edit`}>
          Ubah data klien
        </Link>
      </div>
    </PageStack>
  )
}
