import Link from "next/link";

import { PageHeaderCard, PageStack } from "@/components/access-management/shared";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getContract } from "@/lib/access-management/backend";
import { handleModulePageError, type PageRouteParams } from "@/lib/access-management/page";

export default async function PaymentTermsPage({
  params,
}: {
  params: PageRouteParams<{ contractId: string }>;
}) {
  const { contractId } = await params;

  try {
    const contract = await getContract(Number(contractId));

    return (
      <PageStack data-testid="payment-terms-page">
        <PageHeaderCard
          title={`Termin Pembayaran: ${contract.contract_number}`}
          description="Pengelolaan termin pembayaran sekarang dipusatkan di halaman detail kontrak agar jadwal, pembayaran, dan progres proyek bisa dibaca dalam satu alur."
        />
        <Card>
          <CardHeader>
            <CardTitle>Buka halaman detail kontrak</CardTitle>
            <CardDescription>
              Semua data termin pembayaran dan formulir tambah termin sekarang tersedia langsung di halaman detail kontrak.
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
        <PageHeaderCard title="Termin Pembayaran" description="Halaman tidak dapat dimuat." />
        <Card>
          <CardContent className="py-6 text-sm text-destructive">{handleModulePageError(error)}</CardContent>
        </Card>
      </PageStack>
    );
  }
}
