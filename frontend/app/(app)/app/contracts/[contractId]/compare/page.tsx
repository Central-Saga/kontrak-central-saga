import { redirect } from "next/navigation";

import { DocumentCompare } from "@/components/document-management/document-compare";
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared";
import {
  compareContractDocumentVersions,
  getContract,
  listContractDocumentVersions,
} from "@/lib/access-management/backend";
import { handleModulePageError, readSearchParam, type PageRouteParams, type PageSearchParams } from "@/lib/access-management/page";

async function handleCompare(contractId: string, fromId: number, toId: number) {
  "use server";
  redirect(`/app/contracts/${contractId}/compare?from_version_id=${fromId}&to_version_id=${toId}`);
}

export default async function ContractComparePage({
  params,
  searchParams,
}: {
  params: PageRouteParams<{ contractId: string }>;
  searchParams: PageSearchParams;
}) {
  const { contractId } = await params;
  const resolvedSearchParams = await searchParams;

  const fromVersionId = Number(readSearchParam(resolvedSearchParams, "from_version_id"));
  const toVersionId = Number(readSearchParam(resolvedSearchParams, "to_version_id"));

  let contract = null;
  let versions: Awaited<ReturnType<typeof listContractDocumentVersions>> = [];
  let versionsError: string | null = null;
  let compare: Awaited<ReturnType<typeof compareContractDocumentVersions>> | null = null;
  let compareError: string | null = null;

  try {
    contract = await getContract(Number(contractId));
  } catch (error) {
    return (
      <PageStack>
        <PageHeaderCard
          title="Komparasi Dokumen"
          description="Gagal memuat data kontrak."
        />
        <StatusBanner error={handleModulePageError(error)} />
      </PageStack>
    );
  }

  if (!contract) {
    return (
      <PageStack>
        <PageHeaderCard
          title="Komparasi Dokumen"
          description="Kontrak tidak ditemukan."
        />
        <StatusBanner error="Kontrak tidak ditemukan atau Anda tidak memiliki akses." />
      </PageStack>
    );
  }

  try {
    versions = await listContractDocumentVersions(contract.id, {
      documentType: "main_contract",
    });
  } catch (error) {
    versionsError = handleModulePageError(error);
  }

  if (fromVersionId && toVersionId && !isNaN(fromVersionId) && !isNaN(toVersionId)) {
    if (fromVersionId === toVersionId) {
      compareError = "Pilih dua versi yang berbeda untuk membandingkan.";
    } else {
      try {
        compare = await compareContractDocumentVersions(
          contract.id,
          fromVersionId,
          toVersionId
        );
      } catch (error) {
        compareError = handleModulePageError(error);
      }
    }
  }

  return (
    <PageStack>
      <PageHeaderCard
        title={`Komparasi Dokumen: ${contract.contract_number}`}
        description="Bandingkan dua versi dokumen dengan preview langsung secara side-by-side."
      />

      {versionsError && <StatusBanner error={versionsError} />}

      <DocumentCompare
        versions={versions}
        compare={compare}
        compareError={compareError}
        onCompare={handleCompare.bind(null, contractId)}
      />
    </PageStack>
  );
}
