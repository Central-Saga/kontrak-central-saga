import { createContractAction } from "@/app/(app)/app/access-management/actions"
import { ContractForm } from "@/components/contract-management/contract-form"
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { listClients } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page"

export default async function NewContractPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams
  const error = readSearchParam(resolvedSearchParams, "error")

  let clients = [] as Awaited<ReturnType<typeof listClients>>["data"]
  let message: string | null = null

  try {
    const response = await listClients({ perPage: 100, status: "active" })
    clients = response.data
  } catch (fetchError) {
    message = handleModulePageError(fetchError)
  }

  return (
    <PageStack>
      <PageHeaderCard description="Susun kontrak baru dengan klien, proyek, periode, dan nilai kerja yang jelas sejak awal." title="Tambah kontrak" />
      <StatusBanner error={error ?? message ?? undefined} />
      <ContractForm action={createContractAction} clients={clients} mode="create" />
    </PageStack>
  )
}
