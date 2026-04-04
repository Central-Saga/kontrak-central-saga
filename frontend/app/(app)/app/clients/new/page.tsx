import { createClientAction } from "@/app/(app)/app/access-management/actions"
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { ClientForm } from "@/components/client-management/client-form"
import { PageHeaderCard, PageStack } from "@/components/access-management/shared"
import { readSearchParam, type PageSearchParams } from "@/lib/access-management/page"

export default async function NewClientPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams
  const error = readSearchParam(resolvedSearchParams, "error")

  return (
    <PageStack>
      <PageHeaderCard
        description="Susun identitas klien baru agar tim operasional dapat langsung mengaitkannya ke kontrak dan modul berikutnya."
        title="Tambah klien"
      />
      <StatusToastBridge error={error ?? undefined} />
      <ClientForm action={createClientAction} mode="create" />
    </PageStack>
  )
}
