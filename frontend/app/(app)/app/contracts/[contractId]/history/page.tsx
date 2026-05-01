import Link from "next/link";
import { HistoryIcon } from "lucide-react";

import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared";
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getContract,
  listContractDocumentVersions,
} from "@/lib/access-management/backend";
import { handleModulePageError, readSearchParam, type PageRouteParams, type PageSearchParams } from "@/lib/access-management/page";

const statusMessages = {
  document_uploaded: "Versi dokumen kontrak berhasil diunggah dan masuk ke arsip versi.",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  final: "Final",
  review: "Review",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-muted",
  review: "bg-accent-soft text-secondary-foreground border-highlight/20",
  final: "bg-primary/10 text-primary border-primary/20",
};

function formatDateTime(value?: string | null) {
  if (!value) return "Belum tercatat";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value?: string | null) {
  if (!value) return "Belum tercatat";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const normalized = value / 1024 ** power;
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: normalized >= 100 ? 0 : 1,
  }).format(normalized)} ${units[power]}`;
}

interface ContractHistoryPageProps {
  params: PageRouteParams<{ contractId: string }>;
  searchParams: PageSearchParams;
}

export default async function ContractHistoryPage({
  params,
  searchParams,
}: ContractHistoryPageProps) {
  const { contractId } = await params;
  const resolvedSearchParams = await searchParams;
  const error = readSearchParam(resolvedSearchParams, "error");
  const status = readSearchParam(resolvedSearchParams, "status");

  let contract = null;
  let versions: Awaited<ReturnType<typeof listContractDocumentVersions>> = [];
  let fetchError: string | null = null;

  try {
    const [contractResponse, versionsResponse] = await Promise.all([
      getContract(Number(contractId)),
      listContractDocumentVersions(Number(contractId), { documentType: "main_contract" }),
    ]);
    contract = contractResponse;
    versions = versionsResponse;
  } catch (err) {
    fetchError = handleModulePageError(err);
  }

  if (!contract) {
    return (
      <PageStack>
        <PageHeaderCard
          title="Riwayat Dokumen"
          description="Gagal memuat data kontrak."
        />
        <StatusToastBridge error={error ?? undefined} />
        <StatusBanner error={fetchError ?? "Kontrak tidak ditemukan."} />
      </PageStack>
    );
  }

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <PageStack>
      <PageHeaderCard
        title={`Riwayat: ${contract.contract_number}`}
        description="Lihat timeline perubahan dokumen kontrak dari waktu ke waktu."
      />

      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />

      <div className="flex flex-wrap gap-3">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/app/contracts/${contractId}/documents`}
        >
          Kelola Dokumen
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/app/contracts/${contractId}/compare`}
        >
          Komparasi
        </Link>
      </div>

      {error && <StatusBanner error={error} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Timeline Versi Dokumen
          </CardTitle>
          <CardDescription>
            Total {sortedVersions.length} versi dalam riwayat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedVersions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Belum ada versi dokumen yang tercatat
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-8">
                {sortedVersions.map((version, index) => (
                  <div key={version.id} className="relative pl-12">
                    <div
                      className={`absolute left-2 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                        index === 0
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted bg-background text-muted-foreground"
                      }`}
                    >
                      {sortedVersions.length - index}
                    </div>

                    <div className="rounded-2xl border border-line bg-card-strong p-5">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-mono text-lg font-bold">
                              V{String(version.version_number).padStart(2, "0")}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                                statusColors[version.version_status] ?? statusColors.draft
                              }`}
                            >
                              {statusLabels[version.version_status]}
                            </span>
                            {index === 0 && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Terbaru
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(version.uploaded_at ?? version.created_at)}
                          </p>
                        </div>

                      {version.id && (
                          <a
                            href={`/api/files/contracts/${version.contract_id}/document-versions/${version.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({ size: "sm", variant: "outline" })}
                          >
                            Buka File
                          </a>
                      )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-line bg-background p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Nama File
                          </p>
                          <p className="truncate text-sm font-medium">
                            {version.original_file_name}
                          </p>
                        </div>

                        <div className="rounded-xl border border-line bg-background p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Pengunggah
                          </p>
                          <p className="text-sm font-medium">
                            {version.uploader?.name ?? "Sistem"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-line bg-background p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Ukuran & Format
                          </p>
                          <p className="text-sm font-medium">
                            {formatBytes(version.size_bytes)} • {version.mime_type}
                          </p>
                        </div>

                        <div className="rounded-xl border border-line bg-background p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Checksum
                          </p>
                          <p className="truncate text-xs font-mono">
                            {version.checksum_sha256.slice(0, 16)}...
                          </p>
                        </div>
                      </div>

                      {version.change_summary && (
                        <div className="mt-4 rounded-xl border-l-4 border-primary bg-primary/5 p-4">
                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Ringkasan Perubahan
                          </p>
                          <p className="text-sm">{version.change_summary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageStack>
  );
}
