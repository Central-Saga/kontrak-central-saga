import { updateClientAction } from "@/app/(app)/app/access-management/actions"
import { ClientForm } from "@/components/client-management/client-form"
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { getClient } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageRouteParams, type PageSearchParams } from "@/lib/access-management/page"

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: PageRouteParams<{ clientId: string }>
  searchParams: PageSearchParams
}) {
  const { clientId } = await params
  const resolvedSearchParams = await searchParams
  const error = readSearchParam(resolvedSearchParams, "error")

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
          title="Ubah klien"
        />
        <StatusBanner error={error ?? message ?? undefined} />
      </PageStack>
    )
  }

  const action = updateClientAction.bind(null, client.id)

  return (
    <PageStack>
      <PageHeaderCard
        description="Perbarui identitas perusahaan, kontak utama, dan status operasional klien dari satu halaman edit yang ringkas."
        title={`Ubah klien: ${client.company_name}`}
      />
      <StatusBanner error={error ?? undefined} />
      <ClientForm
        action={action}
        mode="edit"
        values={{
          address: client.address,
          client_code: client.client_code,
          company_name: client.company_name,
          contact_person: client.contact_person,
          email: client.email,
          phone: client.phone,
          portal_access_enabled: client.portal_access_enabled,
          status: client.status,
        }}
      />
    </PageStack>
  )
}
