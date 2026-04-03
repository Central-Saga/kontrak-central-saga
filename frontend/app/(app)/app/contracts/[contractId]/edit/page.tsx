import Link from "next/link"
import { GitCompareArrowsIcon, HistoryIcon } from "lucide-react"
import { redirect } from "next/navigation"

import {
  updateContractAction,
  uploadContractDocumentVersionAction,
} from "@/app/(app)/app/access-management/actions"
import { ContractForm } from "@/components/contract-management/contract-form"
import { ContractDocumentVersionsSection } from "@/components/contract-management/contract-document-versions-section"
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
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

const versionStatusLabels: Record<string, string> = {
  draft: "Draft",
  final: "Final",
  review: "Review",
}

function readPositiveInteger(value?: string) {
  const parsedValue = Number(value ?? "")

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined
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
  const documentVersionsCount = contract.document_versions_count ?? documentVersions.length
  const compareReady = documentVersionsCount >= 2
  const latestDocumentVersion = contract.latest_document_version ?? documentVersions[0]
  const latestDocumentVersionSummary = latestDocumentVersion
    ? [
        `V${String(latestDocumentVersion.version_number).padStart(2, "0")}`,
        versionStatusLabels[latestDocumentVersion.version_status] ?? latestDocumentVersion.version_status,
        formatDateTime(latestDocumentVersion.uploaded_at ?? latestDocumentVersion.created_at) ?? "Belum tercatat",
      ].join(" • ")
    : null

  return (
    <PageStack>
      <PageHeaderCard description="Perbarui identitas kontrak, proyek, status, serta akses ke riwayat versi dokumen dan compare metadata dari satu halaman edit yang tetap ringkas." title={`Ubah kontrak: ${contract.contract_number}`} />
      <StatusBanner error={error ?? undefined} messages={statusMessages} status={status} />

      <Alert>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <AlertTitle>Riwayat versi dokumen tersedia di halaman ini</AlertTitle>
            <AlertDescription>
              {documentVersionsCount > 0
                ? `Saat ini tersimpan ${documentVersionsCount} versi dokumen.${latestDocumentVersionSummary ? ` Versi terbaru ${latestDocumentVersionSummary}.` : ""} ${compareReady ? "Compare metadata sudah siap dipakai." : "Unggah minimal dua versi agar compare metadata aktif."}`
                : "Belum ada arsip dokumen untuk kontrak ini. Lompat ke bagian riwayat dokumen di bawah untuk mengunggah versi pertama dan mulai membangun histori revisi."}
            </AlertDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className={buttonVariants({ variant: "outline" })} href="#contract-document-history">
              <HistoryIcon aria-hidden data-icon="inline-start" />
              Lompat ke riwayat dokumen
            </Link>
            <Link className={buttonVariants({ variant: compareReady ? "secondary" : "outline" })} href="#contract-document-compare">
              <GitCompareArrowsIcon aria-hidden data-icon="inline-start" />
              {compareReady ? "Buka compare metadata" : "Lihat panel compare"}
            </Link>
          </div>
        </div>
      </Alert>

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
