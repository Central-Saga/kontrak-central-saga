import { redirect } from "next/navigation"

import {
  updateContractAction,
  uploadContractDocumentVersionAction,
} from "@/app/(app)/app/access-management/actions"
import { ContractForm } from "@/components/contract-management/contract-form"
import { ContractDocumentVersionsSection } from "@/components/contract-management/contract-document-versions-section"
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import {
  compareContractDocumentVersions,
  getAccessManagementErrorMessage,
  getContract,
  isAccessManagementError,
  listClients,
  listContractDocumentVersions,
} from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageRouteParams, type PageSearchParams } from "@/lib/access-management/page"

const statusMessages = {
  document_uploaded: "Versi dokumen kontrak berhasil diunggah dan masuk ke arsip versi.",
}

function readPositiveInteger(value?: string) {
  const parsedValue = Number(value ?? "")

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined
}

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
  const status = readSearchParam(resolvedSearchParams, "status")
  const compareFromVersionId = readPositiveInteger(readSearchParam(resolvedSearchParams, "from_version_id"))
  const compareToVersionId = readPositiveInteger(readSearchParam(resolvedSearchParams, "to_version_id"))

  let contract = null
  let clients = [] as Awaited<ReturnType<typeof listClients>>["data"]
  let message: string | null = null
  let documentVersions = [] as Awaited<ReturnType<typeof listContractDocumentVersions>>
  let documentVersionsError: string | null = null
  let documentCompare = null as Awaited<ReturnType<typeof compareContractDocumentVersions>> | null
  let documentCompareError: string | null = null

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

  if (contract) {
    try {
      documentVersions = await listContractDocumentVersions(contract.id, {
        documentType: "main_contract",
      })
    } catch (fetchError) {
      documentVersionsError = handleModulePageError(fetchError)
    }

    if (compareFromVersionId && compareToVersionId) {
      if (compareFromVersionId === compareToVersionId) {
        documentCompareError = "Pilih dua versi yang berbeda untuk membandingkan metadata dokumen."
      } else {
        try {
          documentCompare = await compareContractDocumentVersions(
            contract.id,
            compareFromVersionId,
            compareToVersionId,
          )
        } catch (compareError) {
          if (isAccessManagementError(compareError) && compareError.status === 401) {
            redirect(getAccessManagementErrorMessage(compareError))
          }

          documentCompareError = isAccessManagementError(compareError)
            ? compareError.message
            : "Metadata versi dokumen belum bisa dibandingkan sekarang."
        }
      }
    }
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
  const uploadAction = uploadContractDocumentVersionAction.bind(null, contract.id)

  return (
    <PageStack>
      <PageHeaderCard description="Perbarui identitas kontrak, proyek, status, dan detail administrasinya dari satu halaman edit yang ringkas." title={`Ubah kontrak: ${contract.contract_number}`} />
      <StatusBanner error={error ?? undefined} messages={statusMessages} status={status} />
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
      <ContractDocumentVersionsSection
        compare={documentCompare}
        compareError={documentCompareError}
        compareSelection={{
          fromVersionId: compareFromVersionId,
          toVersionId: compareToVersionId,
        }}
        contractEditHref={`/app/contracts/${contract.id}/edit`}
        contractNumber={contract.contract_number}
        error={documentVersionsError}
        uploadAction={uploadAction}
        versions={documentVersions}
      />
    </PageStack>
  )
}
