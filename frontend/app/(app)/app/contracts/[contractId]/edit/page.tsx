import Link from "next/link"
import { FileTextIcon, GitCompareArrowsIcon, HistoryIcon, ArrowRightIcon } from "lucide-react"

import { updateContractAction } from "@/app/(app)/app/access-management/actions"
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { ContractForm } from "@/components/contract-management/contract-form"
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import {
  getContract,
  listClients,
} from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageRouteParams, type PageSearchParams } from "@/lib/access-management/page"

const statusMessages = {
  document_uploaded: "Versi dokumen kontrak berhasil diunggah.",
}

const versionStatusLabels: Record<string, string> = {
  draft: "Draft",
  final: "Final",
  review: "Review",
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

  let contract = null
  let clients: Awaited<ReturnType<typeof listClients>>["data"] = []
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
        <PageHeaderCard 
          description="Detail kontrak tidak bisa dimuat. Periksa akses Anda atau kembali ke daftar kontrak." 
          title="Ubah kontrak" 
        />
        <StatusToastBridge error={error ?? undefined} />
        <StatusBanner error={message ?? undefined} />
      </PageStack>
    )
  }

  const action = updateContractAction.bind(null, contract.id)
  const documentVersionsCount = contract.document_versions_count ?? 0
  const compareReady = documentVersionsCount >= 2
  const latestDocumentVersion = contract.latest_document_version
  const latestDocumentVersionSummary = latestDocumentVersion
    ? [
        `V${String(latestDocumentVersion.version_number).padStart(2, "0")}`,
        versionStatusLabels[latestDocumentVersion.version_status] ?? latestDocumentVersion.version_status,
        formatDateTime(latestDocumentVersion.uploaded_at ?? latestDocumentVersion.created_at) ?? "Belum tercatat",
      ].join(" • ")
    : null

  return (
    <PageStack>
      <PageHeaderCard 
        description="Perbarui identitas kontrak, proyek, status, dan informasi lainnya. Kelola dokumen versi di halaman terpisah." 
        title={`Ubah kontrak: ${contract.contract_number}`} 
      />
      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />

      <Alert>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <AlertTitle>Kelola dokumen kontrak</AlertTitle>
            <AlertDescription>
              {documentVersionsCount > 0
                ? `Saat ini tersimpan ${documentVersionsCount} versi dokumen.${latestDocumentVersionSummary ? ` Versi terbaru ${latestDocumentVersionSummary}.` : ""} ${compareReady ? "Komparasi tersedia." : "Unggah minimal dua versi untuk komparasi."}`
                : "Belum ada dokumen untuk kontrak ini. Unggah dokumen pertama di halaman Dokumen."}
            </AlertDescription>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link 
              className={buttonVariants({ variant: "outline" })} 
              href={`/app/contracts/${contract.id}/documents`}
            >
              <FileTextIcon className="mr-2 h-4 w-4" />
              Dokumen
            </Link>
            <Link 
              className={buttonVariants({ variant: compareReady ? "secondary" : "outline" })} 
              href={`/app/contracts/${contract.id}/compare`}
            >
              <GitCompareArrowsIcon className="mr-2 h-4 w-4" />
              Komparasi
            </Link>
            <Link 
              className={buttonVariants({ variant: documentVersionsCount > 0 ? "secondary" : "outline" })} 
              href={`/app/contracts/${contract.id}/versions`}
            >
              <HistoryIcon className="mr-2 h-4 w-4" />
              Riwayat versi
              <ArrowRightIcon aria-hidden className="ml-1 h-4 w-4" />
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
    </PageStack>
  )
}
