import Link from "next/link"
import { HistoryIcon, ArrowRightIcon } from "lucide-react"

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
  document_uploaded: "Versi dokumen kontrak berhasil diunggah dan masuk ke arsip versi.",
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
        <StatusToastBridge error={error ?? undefined} />
        <StatusBanner error={message ?? undefined} />
      </PageStack>
    )
  }

  const action = updateContractAction.bind(null, contract.id)
  const documentVersionsCount = contract.document_versions_count ?? 0

  return (
    <PageStack>
      <PageHeaderCard description="Perbarui identitas kontrak, proyek, dan status kontrak." title={`Ubah kontrak: ${contract.contract_number}`} />
      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />

      <Alert>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <AlertTitle>Riwayat Versi Dokumen</AlertTitle>
            <AlertDescription>
              {documentVersionsCount > 0
                ? `Saat ini tersimpan ${documentVersionsCount} versi dokumen. Kelola riwayat versi dokumen dan compare metadata di halaman terpisah.`
                : "Belum ada arsip dokumen untuk kontrak ini. Tambahkan versi dokumen pertama melalui halaman riwayat."}
            </AlertDescription>
          </div>

          <Link 
            className={buttonVariants({ variant: documentVersionsCount > 0 ? "secondary" : "outline" })} 
            href={`/app/contracts/${contract.id}/versions`}
          >
            <HistoryIcon aria-hidden data-icon="inline-start" />
            Lihat Riwayat Dokumen
            <ArrowRightIcon aria-hidden data-icon="inline-end" className="ml-1 h-4 w-4" />
          </Link>
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
