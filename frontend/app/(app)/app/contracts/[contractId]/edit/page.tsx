import { updateContractAction } from "@/app/(app)/app/access-management/actions"
import { ContractForm } from "@/components/contract-management/contract-form"
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { getContract, listClients } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageRouteParams, type PageSearchParams } from "@/lib/access-management/page"

export default async function EditContractPage({
  params,
  searchParams,
}: {
  params: PageRouteParams<{ contractId: string }>
  searchParams: PageSearchParams
}) {
  const { contractId } = await params
  const resolvedSearchParams = await searchParams
  const error = readSearchParam(resolvedSearchParams, "error")

  let contract = null
  let clients = [] as Awaited<ReturnType<typeof listClients>>["data"]
  let message: string | null = null

  try {
    const [contractResponse, clientsResponse] = await Promise.all([
      getContract(Number(contractId)),
      listClients({ perPage: 100 }),
    ])
    contract = contractResponse
    clients = clientsResponse.data
  } catch (fetchError) {
    message = handleModulePageError(fetchError)
  }

  if (!contract) {
    return (
      <PageStack>
        <PageHeaderCard description="Detail kontrak tidak bisa dimuat. Periksa akses Anda atau kembali ke daftar kontrak." title="Ubah kontrak" />
        <StatusBanner error={error ?? message ?? undefined} />
      </PageStack>
    )
  }

  const action = updateContractAction.bind(null, contract.id)

  return (
    <PageStack>
      <PageHeaderCard description="Perbarui identitas kontrak, proyek, status, dan detail administrasinya dari satu halaman edit yang ringkas." title={`Ubah kontrak: ${contract.contract_number}`} />
      <StatusBanner error={error ?? undefined} />
      <ContractForm
        action={action}
        clients={clients}
        mode="edit"
        values={{
          client_id: contract.client_id,
          contract_date: contract.contract_date,
          contract_number: contract.contract_number,
          contract_status: contract.contract_status,
          contract_title: contract.contract_title,
          contract_value: contract.contract_value,
          end_date: contract.end_date,
          notes: contract.notes,
          payment_scheme_summary: contract.payment_scheme_summary,
          project_name: contract.project_name,
          project_scope: contract.project_scope,
          start_date: contract.start_date,
        }}
      />
    </PageStack>
  )
}
