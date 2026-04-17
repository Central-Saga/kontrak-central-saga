import Link from "next/link";
import { redirect } from "next/navigation";
import { FileStackIcon, GitCompareArrowsIcon, HistoryIcon } from "lucide-react";

import { uploadContractDocumentVersionAction } from "@/app/(app)/app/access-management/actions";
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  getContract,
  listContractDocumentVersions,
} from "@/lib/access-management/backend";
import { handleModulePageError, type PageRouteParams } from "@/lib/access-management/page";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  final: "Final",
  review: "Review",
};

const documentTypeLabels: Record<string, string> = {
  amendment: "Amandemen",
  appendix: "Lampiran",
  main_contract: "Kontrak utama",
  supporting_document: "Dokumen pendukung",
};

const selectClassName =
  "flex h-11 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function formatDateTime(value?: string | null) {
  if (!value) return "Belum tercatat";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
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

interface ContractDocumentsPageProps {
  params: PageRouteParams<{ contractId: string }>;
}

export default async function ContractDocumentsPage({
  params,
}: ContractDocumentsPageProps) {
  const { contractId } = await params;

  let contract = null;
  let versions: Awaited<ReturnType<typeof listContractDocumentVersions>> = [];
  let error: string | null = null;

  try {
    const [contractResponse, versionsResponse] = await Promise.all([
      getContract(Number(contractId)),
      listContractDocumentVersions(Number(contractId), { documentType: "main_contract" }),
    ]);
    contract = contractResponse;
    versions = versionsResponse;
  } catch (fetchError) {
    error = handleModulePageError(fetchError);
  }

  if (!contract) {
    return (
      <PageStack>
        <PageHeaderCard
          title="Dokumen Kontrak"
          description="Gagal memuat data kontrak."
        />
        <StatusBanner error={error ?? "Kontrak tidak ditemukan."} />
      </PageStack>
    );
  }

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);
  const latestVersion = sortedVersions[0];
  const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1;

  const uploadAction = uploadContractDocumentVersionAction.bind(null, contract.id);

  return (
    <PageStack>
      <PageHeaderCard
        title={`Dokumen: ${contract.contract_number}`}
        description="Kelola versi dokumen kontrak, unggah revisi baru, dan lihat riwayat."
      />

      <div className="flex flex-wrap gap-3">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/app/contracts/${contractId}/compare`}
        >
          <GitCompareArrowsIcon className="mr-2 h-4 w-4" />
          Komparasi Dokumen
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/app/contracts/${contractId}/history`}
        >
          <HistoryIcon className="mr-2 h-4 w-4" />
          Lihat Timeline
        </Link>
      </div>

      {error && <StatusBanner error={error} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Unggah Versi Baru</CardTitle>
            <CardDescription>
              Simpan revisi kontrak sebagai versi baru. Versi berikutnya: V
              {String(nextVersionNumber).padStart(2, "0")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={uploadAction} className="flex flex-col gap-6">
              <input name="document_type" type="hidden" value="main_contract" />

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="document-file">File dokumen</FieldLabel>
                  <Input
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    id="document-file"
                    name="file"
                    required
                    type="file"
                  />
                  <FieldDescription>
                    PDF, Word, atau gambar (JPG/PNG)
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="version-status">Status versi</FieldLabel>
                  <select
                    className={selectClassName}
                    defaultValue="draft"
                    id="version-status"
                    name="version_status"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="final">Final</option>
                  </select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="change-summary">Ringkasan perubahan</FieldLabel>
                  <textarea
                    className="min-h-28 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    id="change-summary"
                    name="change_summary"
                    placeholder="Deskripsikan perubahan yang dilakukan..."
                  />
                </Field>
              </FieldGroup>

              <Button size="lg" type="submit">
                Unggah Versi Baru
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Versi Dokumen</CardTitle>
            <CardDescription>
              Total {sortedVersions.length} versi tersimpan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedVersions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="inline-flex size-12 items-center justify-center rounded-full border border-line bg-background text-highlight"
                >
                  <FileStackIcon className="size-5" />
                </span>
                <p className="text-muted-foreground">Belum ada dokumen yang diunggah</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sortedVersions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-2xl border border-line bg-card-strong p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-line bg-background px-2 py-1 text-xs font-mono">
                            V{String(version.version_number).padStart(2, "0")}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              version.version_status === "final"
                                ? "border border-primary/20 bg-primary/10 text-primary"
                                : version.version_status === "review"
                                  ? "border border-highlight/20 bg-accent-soft text-secondary-foreground"
                                  : "border border-line bg-background text-muted"
                            }`}
                          >
                            {statusLabels[version.version_status]}
                          </span>
                        </div>
                        <p className="font-medium">{version.original_file_name}</p>
                        {version.change_summary && (
                          <p className="text-sm text-muted-foreground">
                            {version.change_summary}
                          </p>
                        )}
                      </div>

                      {version.media?.url && (
                        <a
                          href={version.media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonVariants({ size: "sm", variant: "outline" })}
                        >
                          Buka File
                        </a>
                      )}
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                      <div>
                        <span className="text-xs uppercase">Diunggah: </span>
                        {formatDateTime(version.uploaded_at)}
                      </div>
                      <div>
                        <span className="text-xs uppercase">Pengunggah: </span>
                        {version.uploader?.name ?? "Sistem"}
                      </div>
                      <div>
                        <span className="text-xs uppercase">Ukuran: </span>
                        {formatBytes(version.size_bytes)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageStack>
  );
}
