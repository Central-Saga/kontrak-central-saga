import Link from "next/link";

import { PageHeaderCard, PageStack } from "@/components/access-management/shared";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getContract } from "@/lib/access-management/backend";
import { handleModulePageError, type PageRouteParams } from "@/lib/access-management/page";

export default async function PaymentsPage({
  params,
}: {
  params: PageRouteParams<{ contractId: string }>;
}) {
  const { contractId } = await params;

  try {
    const contract = await getContract(Number(contractId));

    return (
      <PageStack data-testid="payments-page">
        <PageHeaderCard
          title={`Pembayaran: ${contract.contract_number}`}
          description="Pengelolaan pembayaran dan upload bukti pembayaran sekarang dipusatkan di halaman detail kontrak agar tiap termin langsung terlihat status dan realisasinya."
        />
        <Card>
          <CardHeader>
            <CardTitle>Buka halaman detail kontrak</CardTitle>
            <CardDescription>
              Semua data pembayaran, daftar bukti pembayaran, dan form upload bukti sekarang tersedia di halaman detail kontrak.
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
        <PageHeaderCard title="Pembayaran" description="Halaman tidak dapat dimuat." />
        <Card>
          <CardContent className="py-6 text-sm text-destructive">{handleModulePageError(error)}</CardContent>
        </Card>
      </PageStack>
    );
  }
}
