import Link from "next/link";

import { PageHeaderCard, PageStack } from "@/components/access-management/shared";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getContract } from "@/lib/access-management/backend";
import { handleModulePageError, type PageRouteParams } from "@/lib/access-management/page";

export default async function ProjectProgressPage({
  params,
}: {
  params: PageRouteParams<{ contractId: string }>;
}) {
  const { contractId } = await params;

  try {
    const contract = await getContract(Number(contractId));

    return (
      <PageStack data-testid="project-progress-page">
        <PageHeaderCard
          title={`Progres Proyek: ${contract.contract_number}`}
          description="Pencatatan progres proyek sekarang dipusatkan di halaman detail kontrak supaya timeline operasional kontrak bisa dibaca dari satu tempat."
        />
        <Card>
          <CardHeader>
            <CardTitle>Buka halaman detail kontrak</CardTitle>
            <CardDescription>
              Semua update progres proyek dan formulir tambah progres sekarang tersedia langsung di halaman detail kontrak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={buttonVariants({ variant: "default" })} href={`/app/contracts/${contract.id}`}>
              Kembali ke detail kontrak
            </Link>
          </CardContent>
        </Card>
      </PageStack>
    );
  } catch (error) {
    return (
      <PageStack>
        <PageHeaderCard title="Progres Proyek" description="Halaman tidak dapat dimuat." />
        <Card>
          <CardContent className="py-6 text-sm text-destructive">{handleModulePageError(error)}</CardContent>
        </Card>
      </PageStack>
    );
  }
}
