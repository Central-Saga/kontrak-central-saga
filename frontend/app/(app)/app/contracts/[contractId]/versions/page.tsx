import Link from "next/link"
import { GitCompareArrowsIcon, HistoryIcon, ArrowLeftIcon } from "lucide-react"
import { redirect } from "next/navigation"

import { uploadContractDocumentVersionAction } from "@/app/(app)/app/access-management/actions"
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { ContractDocumentVersionsSection } from "@/components/contract-management/contract-document-versions-section"
import { DiffStyles } from "@/components/contract-management/diff-styles"
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import {
  compareContractDocumentContent,
  compareContractDocumentVersions,
  getAccessManagementErrorMessage,
  getContract,
  isAccessManagementError,
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

export default async function ContractVersionsPage({
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
  let message: string | null = null
  let documentVersions = [] as Awaited<ReturnType<typeof listContractDocumentVersions>>
  let documentVersionsError: string | null = null
  let documentCompare = null as Awaited<ReturnType<typeof compareContractDocumentVersions>> | null
  let documentCompareError: string | null = null
  let contentDiff = null as Awaited<ReturnType<typeof compareContractDocumentContent>> | null
  let contentDiffError: string | null = null

  try {
    contract = await getContract(Number(contractId))
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
          // Also fetch content diff for the same versions
          contentDiff = await compareContractDocumentContent(
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
          contentDiffError = "Gagal memuat perbandingan konten dokumen."
        }
      }
    }
  }

  if (!contract) {
    return (
      <PageStack>
        <PageHeaderCard 
          description="Detail kontrak tidak bisa dimuat. Periksa akses Anda atau kembali ke daftar kontrak." 
          title="Riwayat Versi Dokumen" 
        />
        <StatusToastBridge error={error ?? undefined} />
        <StatusBanner error={message ?? undefined} />
      </PageStack>
    )
  }

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
      <DiffStyles />
      <PageHeaderCard 
        description={`Riwayat versi dokumen dan compare metadata untuk kontrak ${contract.contract_number}`} 
        title={`Riwayat Dokumen: ${contract.contract_title}`} 
      />
      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />

      <div className="flex flex-wrap gap-3">
        <Link 
          className={buttonVariants({ variant: "outline" })} 
          href={`/app/contracts/${contract.id}/edit`}
        >
          <ArrowLeftIcon aria-hidden data-icon="inline-start" />
          Kembali ke detail kontrak
        </Link>
        {compareReady && (
          <Link 
            className={buttonVariants({ variant: "secondary" })} 
            href="#contract-document-compare"
          >
            <GitCompareArrowsIcon aria-hidden data-icon="inline-start" />
            Buka compare metadata
          </Link>
        )}
      </div>

      <Alert>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <AlertTitle className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              Informasi Versi Dokumen
            </AlertTitle>
            <AlertDescription>
              {documentVersionsCount > 0
                ? `Saat ini tersimpan ${documentVersionsCount} versi dokumen.${latestDocumentVersionSummary ? ` Versi terbaru ${latestDocumentVersionSummary}.` : ""} ${compareReady ? "Compare metadata sudah siap dipakai." : "Unggah minimal dua versi agar compare metadata aktif."}`
                : "Belum ada arsip dokumen untuk kontrak ini. Unggah versi pertama untuk memulai histori revisi."}
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <ContractDocumentVersionsSection
        compare={documentCompare}
        compareError={documentCompareError}
        compareSelection={{
          fromVersionId: compareFromVersionId,
          toVersionId: compareToVersionId,
        }}
        contentDiff={contentDiff}
        contentDiffError={contentDiffError}
        contractEditHref={`/app/contracts/${contract.id}/versions`}
        contractNumber={contract.contract_number}
        error={documentVersionsError}
        uploadAction={uploadAction}
        versions={documentVersions}
      />
    </PageStack>
  )
}