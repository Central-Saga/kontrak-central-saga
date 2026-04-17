'use client'

import { useState } from 'react'
import { ArrowRightLeftIcon, ColumnsIcon, EyeIcon, GitCompareArrowsIcon } from 'lucide-react'
import { DocumentPreview } from './document-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

type CompareMode = 'side-by-side' | 'overlay'

interface DocumentVersion {
  id: number
  version_number: number
  version_status: string
  original_file_name: string
  mime_type: string
  size_bytes: number
  checksum_sha256: string
  uploaded_at?: string | null
  change_summary?: string | null
  uploader?: { name: string } | null
  media?: { url: string } | null
}

interface CompareDifference {
  field: string
  from: string | number | null
  to: string | number | null
}

interface CompareResult {
  from_version: DocumentVersion
  to_version: DocumentVersion
  same_file: boolean
  differences: CompareDifference[]
}

interface DocumentCompareProps {
  versions: DocumentVersion[]
  compare: CompareResult | null
  compareError?: string | null
  onCompare: (fromVersionId: number, toVersionId: number) => void
}

const documentTypeLabels: Record<string, string> = {
  amendment: 'Amandemen',
  appendix: 'Lampiran',
  main_contract: 'Kontrak utama',
  supporting_document: 'Dokumen pendukung',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  final: 'Final',
  review: 'Review',
}

const fieldLabels: Record<string, string> = {
  change_summary: 'Ringkasan perubahan',
  checksum_sha256: 'Checksum SHA-256',
  document_type: 'Jenis dokumen',
  mime_type: 'Format file',
  original_file_name: 'Nama file',
  size_bytes: 'Ukuran file',
  uploaded_at: 'Waktu unggah',
  uploaded_by: 'Pengunggah',
  version_status: 'Status versi',
}

const selectClassName =
  'flex h-11 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

function formatDateTime(value?: string | null) {
  if (!value) return 'Belum tercatat'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const power = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const normalized = value / 1024 ** power
  return `${new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: normalized >= 100 ? 0 : 1,
  }).format(normalized)} ${units[power]}`
}

function formatDiffValue(field: string, value: string | number | null) {
  if (value === null || value === '') return '—'
  if (field === 'size_bytes' && typeof value === 'number') return formatBytes(value)
  if (field === 'document_type') return documentTypeLabels[String(value)] ?? String(value)
  if (field === 'version_status') return statusLabels[String(value)] ?? String(value)
  if (field === 'uploaded_at') return formatDateTime(String(value))
  return String(value)
}

function getFieldLabel(field: string) {
  return fieldLabels[field] ?? field.replaceAll('_', ' ')
}

export function DocumentCompare({
  versions,
  compare,
  compareError,
  onCompare,
}: DocumentCompareProps) {
  const [mode, setMode] = useState<CompareMode>('side-by-side')
  const [overlayOpacity, setOverlayOpacity] = useState(50)
  const [fromVersionId, setFromVersionId] = useState<number | ''>('')
  const [toVersionId, setToVersionId] = useState<number | ''>('')

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number)
  const fromVersion = sortedVersions.find((v) => v.id === fromVersionId)
  const toVersion = sortedVersions.find((v) => v.id === toVersionId)

  const handleCompare = () => {
    if (fromVersionId && toVersionId && fromVersionId !== toVersionId) {
      onCompare(fromVersionId, toVersionId)
    }
  }

  if (sortedVersions.length < 2) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-full border border-line bg-background text-highlight">
              <GitCompareArrowsIcon className="size-5" />
            </span>
            <div className="flex flex-col gap-2">
              <p className="text-base font-semibold text-foreground">Minimal dua versi diperlukan</p>
              <p className="text-sm leading-7 text-muted">
                Unggah minimal dua versi dokumen untuk menggunakan fitur komparasi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Pilih Versi untuk Dibandingkan</CardTitle>
          <CardDescription>
            Pilih dua versi dokumen yang ingin Anda bandingkan. Anda dapat melihat preview dokumen
            dan membandingkan metadata-nya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel>Versi Awal (Kiri)</FieldLabel>
                <select
                  className={selectClassName}
                  value={fromVersionId}
                  onChange={(e) => setFromVersionId(Number(e.target.value))}
                >
                  <option value="">Pilih versi...</option>
                  {sortedVersions.map((version) => (
                    <option key={version.id} value={version.id}>
                      V{version.version_number} • {statusLabels[version.version_status]} •{' '}
                      {formatDateTime(version.uploaded_at)}
                    </option>
                  ))}
                </select>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Versi Tujuan (Kanan)</FieldLabel>
                <select
                  className={selectClassName}
                  value={toVersionId}
                  onChange={(e) => setToVersionId(Number(e.target.value))}
                >
                  <option value="">Pilih versi...</option>
                  {sortedVersions.map((version) => (
                    <option key={version.id} value={version.id}>
                      V{version.version_number} • {statusLabels[version.version_status]} •{' '}
                      {formatDateTime(version.uploaded_at)}
                    </option>
                  ))}
                </select>
              </Field>
            </FieldGroup>
          </div>

          {fromVersionId === toVersionId && fromVersionId !== '' && (
            <p className="mt-4 text-sm text-destructive">
              Pilih dua versi yang berbeda untuk membandingkan.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              onClick={handleCompare}
              disabled={!fromVersionId || !toVersionId || fromVersionId === toVersionId}
            >
              <GitCompareArrowsIcon className="mr-2 h-4 w-4" />
              Bandingkan Versi
            </Button>
          </div>
        </CardContent>
      </Card>

      {compareError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-4 text-sm text-destructive">
          {compareError}
        </div>
      )}

      {compare && fromVersion && toVersion && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Hasil Komparasi: V{fromVersion.version_number} → V{toVersion.version_number}
            </h3>
            <div className="flex items-center gap-2 rounded-lg border p-1">
              <button
                onClick={() => setMode('side-by-side')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  mode === 'side-by-side'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ColumnsIcon className="h-4 w-4" />
                Side-by-Side
              </button>
              <button
                onClick={() => setMode('overlay')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  mode === 'overlay'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <EyeIcon className="h-4 w-4" />
                Overlay
              </button>
            </div>
          </div>

          {mode === 'side-by-side' ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                      V{fromVersion.version_number}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {statusLabels[fromVersion.version_status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {fromVersion.original_file_name}
                  </p>
                </CardHeader>
                <CardContent>
                  {fromVersion.media?.url ? (
                    <DocumentPreview
                      url={fromVersion.media.url}
                      fileName={fromVersion.original_file_name}
                      mimeType={fromVersion.mime_type}
                      className="max-h-[600px] overflow-auto"
                    />
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      File tidak tersedia untuk preview
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                      V{toVersion.version_number}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {statusLabels[toVersion.version_status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {toVersion.original_file_name}
                  </p>
                </CardHeader>
                <CardContent>
                  {toVersion.media?.url ? (
                    <DocumentPreview
                      url={toVersion.media.url}
                      fileName={toVersion.original_file_name}
                      mimeType={toVersion.mime_type}
                      className="max-h-[600px] overflow-auto"
                    />
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      File tidak tersedia untuk preview
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mode Overlay</CardTitle>
                <CardDescription>
                  Geser slider untuk mengatur transparansi antara kedua versi dokumen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <span className="text-sm">V{fromVersion.version_number}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm">V{toVersion.version_number}</span>
                </div>

                <div className="relative max-h-[600px] overflow-hidden">
                  {fromVersion.media?.url && (
                    <div className="absolute inset-0">
                      <DocumentPreview
                        url={fromVersion.media.url}
                        fileName={fromVersion.original_file_name}
                        mimeType={fromVersion.mime_type}
                      />
                    </div>
                  )}

                  {toVersion.media?.url && (
                    <div
                      className="relative"
                      style={{ opacity: overlayOpacity / 100 }}
                    >
                      <DocumentPreview
                        url={toVersion.media.url}
                        fileName={toVersion.original_file_name}
                        mimeType={toVersion.mime_type}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ArrowRightLeftIcon className="h-5 w-5" />
                Perbandingan Metadata
              </CardTitle>
              <CardDescription>
                {compare.same_file
                  ? 'Checksum identik — file sama, tetapi metadata masih bisa berubah.'
                  : 'Checksum berbeda — arsip berasal dari file yang berbeda.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {compare.differences.length ? (
                <div className="overflow-hidden rounded-2xl border border-line">
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed border-separate border-spacing-0 text-left text-sm">
                      <thead>
                        <tr>
                          <th className="w-[28%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">
                            Metadata
                          </th>
                          <th className="w-[36%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">
                            Versi Awal
                          </th>
                          <th className="w-[36%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">
                            Versi Tujuan
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {compare.differences.map((difference) => (
                          <tr key={difference.field}>
                            <td className="border border-line px-4 py-4 align-top font-medium text-foreground">
                              {getFieldLabel(difference.field)}
                            </td>
                            <td className="border border-line px-4 py-4 align-top text-muted">
                              {formatDiffValue(difference.field, difference.from)}
                            </td>
                            <td className="border border-line px-4 py-4 align-top text-muted">
                              {formatDiffValue(difference.field, difference.to)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Tidak ada perubahan metadata di antara dua arsip yang dipilih. File dan
                  informasi pelengkapnya identik.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
