import Link from "next/link"
import {
  ArrowRightLeftIcon,
  FileStackIcon,
  FileTextIcon,
  GitCompareArrowsIcon,
  HistoryIcon,
  RefreshCcwDotIcon,
  UploadIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type {
  ContractDocumentVersionCompareRecord,
  ContractDocumentVersionRecord,
} from "@/lib/access-management/backend"

type ContractDocumentVersionsSectionProps = {
  compare: ContractDocumentVersionCompareRecord | null
  compareError?: string | null
  compareSelection?: {
    fromVersionId?: number
    toVersionId?: number
  }
  contractEditHref: string
  contractNumber: string
  error?: string | null
  uploadAction: (formData: FormData) => Promise<void>
  versions: ContractDocumentVersionRecord[]
}

const documentTypeLabels: Record<string, string> = {
  amendment: "Amandemen",
  appendix: "Lampiran",
  main_contract: "Kontrak utama",
  supporting_document: "Dokumen pendukung",
}

const fieldLabels: Record<string, string> = {
  change_summary: "Ringkasan perubahan",
  checksum_sha256: "Checksum SHA-256",
  document_type: "Jenis dokumen",
  mime_type: "Format file",
  original_file_name: "Nama file",
  size_bytes: "Ukuran file",
  uploaded_at: "Waktu unggah",
  uploaded_by: "Pengunggah",
  version_status: "Status versi",
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  final: "Final",
  review: "Review",
}

const selectClassName =
  "flex h-11 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Belum tercatat"
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

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB"]
  const power = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const normalized = value / 1024 ** power

  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: normalized >= 100 ? 0 : 1,
  }).format(normalized)} ${units[power]}`
}

function formatDiffValue(field: string, value: string | number | null) {
  if (value === null || value === "") {
    return "—"
  }

  if (field === "size_bytes" && typeof value === "number") {
    return formatBytes(value)
  }

  if (field === "document_type") {
    return documentTypeLabels[String(value)] ?? String(value)
  }

  if (field === "version_status") {
    return statusLabels[String(value)] ?? String(value)
  }

  if (field === "uploaded_at") {
    return formatDateTime(String(value))
  }

  return String(value)
}

function getFieldLabel(field: string) {
  return fieldLabels[field] ?? field.replaceAll("_", " ")
}

function VersionStatusPill({ status }: { status: string }) {
  const palette =
    status === "final"
      ? "border-primary/20 bg-primary/10 text-primary"
      : status === "review"
        ? "border-highlight/20 bg-accent-soft text-secondary-foreground"
        : "border-line bg-background text-muted"

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${palette}`}>
      {statusLabels[status] ?? status}
    </span>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-card-strong px-4 py-4">
      <p className="text-xs font-mono uppercase tracking-[0.18em] text-highlight">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

export function ContractDocumentVersionsSection({
  compare,
  compareError,
  compareSelection,
  contractEditHref,
  contractNumber,
  error,
  uploadAction,
  versions,
}: ContractDocumentVersionsSectionProps) {
  const sortedVersions = [...versions].sort((left, right) => right.version_number - left.version_number)
  const latestVersion = sortedVersions[0]
  const suggestedToVersionId = compareSelection?.toVersionId ?? latestVersion?.id
  const suggestedFromVersionId =
    compareSelection?.fromVersionId ?? sortedVersions.find((version) => version.id !== suggestedToVersionId)?.id
  const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1
  const selectedVersionIds = new Set([compareSelection?.fromVersionId, compareSelection?.toVersionId].filter(Boolean))
  const latestUploadLabel = latestVersion ? formatDateTime(latestVersion.uploaded_at ?? latestVersion.created_at) : "Belum ada arsip"
  const compareReady = sortedVersions.length >= 2

  return (
    <Card id="contract-document-history">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-highlight">Dokumen kontrak</p>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl">Riwayat versi dokumen & compare metadata</CardTitle>
              <CardDescription>
                Arsip revisi dokumen utama {contractNumber} tersimpan di sini. Unggah versi baru dari panel kiri, lalu gunakan compare metadata di panel kanan untuk melacak perubahan tanpa membuka isi file.
              </CardDescription>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-xl">
            <SummaryTile label="Versi tersimpan" value={String(sortedVersions.length).padStart(2, "0")} />
            <SummaryTile label="Versi berikutnya" value={`V${String(nextVersionNumber).padStart(2, "0")}`} />
            <SummaryTile label="Unggahan terakhir" value={latestUploadLabel} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-8">
        <Alert>
          <AlertTitle>Cara pakai riwayat versi dokumen</AlertTitle>
          <AlertDescription>
            {sortedVersions.length
              ? `Arsip saat ini menyimpan ${sortedVersions.length} versi. Unggah revisi baru untuk menambah histori, lalu pilih dua versi di panel compare. Hasil compare muncul tepat di bawah form compare dan versi yang dipakai akan disorot di timeline.`
              : "Mulai dengan mengunggah versi pertama dokumen kontrak utama. Setelah versi kedua tersedia, panel compare metadata di sebelah kanan akan langsung bisa digunakan."}
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-3xl border border-line bg-card-strong p-6" id="contract-document-upload">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-foreground">Unggah versi baru ke arsip</p>
              <p className="text-sm leading-7 text-muted">
                Simpan setiap revisi kontrak utama sebagai arsip baru lengkap dengan status versi dan ringkasan perubahan. Setelah diunggah, versi baru langsung muncul di timeline untuk audit cepat.
              </p>
            </div>

            <form action={uploadAction} className="mt-6 flex flex-col gap-6">
              <input name="document_type" type="hidden" value="main_contract" />

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="contract-document-file">File dokumen</FieldLabel>
                  <Input accept=".pdf,.doc,.docx" id="contract-document-file" name="file" required type="file" />
                  <FieldDescription>Gunakan PDF atau dokumen kerja final agar arsip versi tetap mudah diverifikasi.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="contract-document-version-status">Status versi</FieldLabel>
                  <select
                    className={selectClassName}
                    defaultValue="draft"
                    id="contract-document-version-status"
                    name="version_status"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="final">Final</option>
                  </select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="contract-document-change-summary">Ringkasan perubahan</FieldLabel>
                  <textarea
                    className="min-h-28 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-hidden transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    id="contract-document-change-summary"
                    name="change_summary"
                    placeholder="Contoh: Penyesuaian pasal pembayaran termin ketiga setelah review legal."
                  />
                  <FieldDescription>Catatan singkat ini akan tampil di timeline versi dan panel perbandingan metadata.</FieldDescription>
                </Field>
              </FieldGroup>

              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" type="submit">
                  <UploadIcon aria-hidden data-icon="inline-start" />
                  Unggah versi baru
                </Button>
                <p className="text-sm text-muted">Jenis dokumen yang diarsipkan: kontrak utama.</p>
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-line bg-card-strong p-6" id="contract-document-compare">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-foreground">Bandingkan dua versi dokumen</p>
              <p className="text-sm leading-7 text-muted">
                Pilih versi lama di kolom kiri dan versi pembanding di kolom kanan untuk melihat perbedaan nama file, status versi, checksum, waktu unggah, dan ringkasan perubahan secara berdampingan.
              </p>
            </div>

            {compareReady ? (
              <form className="mt-6 flex flex-col gap-6" method="GET">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="contract-document-compare-from">Bandingkan dari</FieldLabel>
                    <select
                      className={selectClassName}
                      defaultValue={suggestedFromVersionId ? String(suggestedFromVersionId) : ""}
                      id="contract-document-compare-from"
                      name="from_version_id"
                    >
                      <option value="">Pilih versi sumber</option>
                      {sortedVersions.map((version) => (
                        <option key={version.id} value={version.id}>
                          V{version.version_number} • {statusLabels[version.version_status] ?? version.version_status}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="contract-document-compare-to">Bandingkan ke</FieldLabel>
                    <select
                      className={selectClassName}
                      defaultValue={suggestedToVersionId ? String(suggestedToVersionId) : ""}
                      id="contract-document-compare-to"
                      name="to_version_id"
                    >
                      <option value="">Pilih versi tujuan</option>
                      {sortedVersions.map((version) => (
                        <option key={version.id} value={version.id}>
                          V{version.version_number} • {statusLabels[version.version_status] ?? version.version_status}
                        </option>
                      ))}
                    </select>
                  </Field>
                </FieldGroup>

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" variant="secondary">
                    <GitCompareArrowsIcon aria-hidden data-icon="inline-start" />
                    Bandingkan metadata
                  </Button>
                  {(compareSelection?.fromVersionId || compareSelection?.toVersionId) ? (
                    <Link className={buttonVariants({ size: "default", variant: "outline" })} href={contractEditHref}>
                      <RefreshCcwDotIcon aria-hidden data-icon="inline-start" />
                      Reset compare
                    </Link>
                  ) : null}
                </div>
                <p className="text-sm leading-7 text-muted">
                  Setelah tombol compare dijalankan, hasil perbedaan metadata akan tampil di panel bawah dan versi yang terpilih akan diberi penanda pada timeline arsip.
                </p>
              </form>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-line bg-background px-4 py-5 text-sm text-muted">
                Minimal dua versi diperlukan sebelum compare metadata aktif. Unggah versi kedua dari panel kiri, lalu kembali ke area compare ini.
              </div>
            )}

            <div className="mt-6 rounded-3xl border border-line bg-background px-4 py-5">
              {compareError ? (
                <p className="text-sm leading-7 text-destructive">{compareError}</p>
              ) : compare ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <ArrowRightLeftIcon aria-hidden className="mr-1 size-3.5" />
                      V{compare.from_version.version_number} ke V{compare.to_version.version_number}
                    </span>
                    <span className="text-sm text-muted">
                      {compare.same_file
                        ? "Checksum identik — file sama, tetapi metadata masih bisa berubah."
                        : "Checksum berbeda — arsip berasal dari file yang berbeda."}
                    </span>
                  </div>

                  {compare.differences.length ? (
                    <div className="overflow-hidden rounded-3xl border border-line">
                      <div className="overflow-x-auto">
                        <table className="min-w-full table-fixed border-separate border-spacing-0 text-left text-sm">
                          <thead>
                            <tr>
                              <th className="w-[28%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Metadata</th>
                              <th className="w-[36%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Versi awal</th>
                              <th className="w-[36%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Versi tujuan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {compare.differences.map((difference) => (
                              <tr key={difference.field}>
                                <td className="border border-line px-4 py-4 align-top font-medium text-foreground">{getFieldLabel(difference.field)}</td>
                                <td className="border border-line px-4 py-4 align-top text-muted">{formatDiffValue(difference.field, difference.from)}</td>
                                <td className="border border-line px-4 py-4 align-top text-muted">{formatDiffValue(difference.field, difference.to)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-7 text-muted">
                      Tidak ada perubahan metadata di antara dua arsip yang dipilih. File dan informasi pelengkapnya identik.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Pilih dua versi di panel compare di atas, lalu klik <span className="font-medium text-foreground">Bandingkan metadata</span>. Ringkasan perbedaan akan tampil di sini, sementara versi yang dipakai ikut disorot pada timeline di bawah.
                </p>
              )}
            </div>
          </section>
        </div>

        <Separator />

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">Timeline arsip versi</p>
            <p className="text-sm leading-7 text-muted">
              Lihat urutan revisi dokumen, pengunggah, checksum, dan catatan perubahan dalam satu timeline. Jika sebuah versi sedang dipakai di compare, kartu versinya akan diberi penanda khusus.
            </p>
          </div>

          {error ? (
            <div className="rounded-3xl border border-dashed border-line bg-card-strong px-5 py-6 text-sm leading-7 text-destructive">
              {error}
            </div>
          ) : sortedVersions.length ? (
            <div className="flex flex-col gap-4">
              {sortedVersions.map((version) => {
                const isSelected = selectedVersionIds.has(version.id)

                return (
                  <article
                    key={version.id}
                    className={[
                      "rounded-3xl border bg-card-strong p-5 transition-colors",
                      isSelected ? "border-primary/30 bg-primary/5" : "border-line",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center rounded-full border border-line bg-background px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-highlight">
                            <HistoryIcon aria-hidden className="mr-1 size-3.5" />
                            V{String(version.version_number).padStart(2, "0")}
                          </span>
                          <VersionStatusPill status={version.version_status} />
                          <span className="inline-flex items-center rounded-full border border-line bg-background px-3 py-1 text-xs font-medium text-muted">
                            {documentTypeLabels[version.document_type] ?? version.document_type}
                          </span>
                          {isSelected ? (
                            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                              Dipakai di compare
                            </span>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="text-base font-semibold text-foreground">{version.original_file_name}</p>
                          <p className="text-sm leading-7 text-muted">
                            {version.change_summary ?? "Tidak ada ringkasan perubahan untuk versi ini."}
                          </p>
                        </div>
                      </div>

                      {version.media?.url ? (
                        <a
                          className={buttonVariants({ size: "sm", variant: "outline" })}
                          href={version.media.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <FileTextIcon aria-hidden data-icon="inline-start" />
                          Buka file
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-line bg-background px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">Diunggah</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{formatDateTime(version.uploaded_at ?? version.created_at)}</p>
                      </div>
                      <div className="rounded-2xl border border-line bg-background px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">Pengunggah</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{version.uploader?.name ?? "Sistem / tidak tercatat"}</p>
                      </div>
                      <div className="rounded-2xl border border-line bg-background px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">Format & ukuran</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {version.mime_type} • {formatBytes(version.size_bytes)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-line bg-background px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">Checksum</p>
                        <p className="mt-1 truncate text-sm font-medium text-foreground">{version.checksum_sha256}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-line bg-card-strong px-5 py-8 text-center">
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <span className="inline-flex size-12 items-center justify-center rounded-full border border-line bg-background text-highlight">
                  <FileStackIcon aria-hidden className="size-5" />
                </span>
                <div className="flex flex-col gap-2">
                  <p className="text-base font-semibold text-foreground">Belum ada versi dokumen</p>
                  <p className="text-sm leading-7 text-muted">
                    Arsip pertama akan muncul di sini setelah Anda mengunggah dokumen kontrak utama melalui panel upload di atas. Setelah versi kedua tersedia, compare metadata juga otomatis siap dipakai.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
