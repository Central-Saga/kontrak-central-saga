"use client"

import { useState } from "react"
import { GitCompareArrowsIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { DocumentVersionContentDiffRecord } from "@/lib/access-management/backend"

interface DocumentContentDiffProps {
  contractId: number
  compare: DocumentVersionContentDiffRecord | null
  compareError?: string | null
  onClose?: () => void
}

export function DocumentContentDiff({
  contractId,
  compare,
  compareError,
  onClose,
}: DocumentContentDiffProps) {
  const [showStats, setShowStats] = useState(true)

  if (compareError) {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompareArrowsIcon className="size-5 text-destructive" />
            Gagal memuat perbandingan konten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{compareError}</p>
        </CardContent>
      </Card>
    )
  }

  if (!compare) {
    return null
  }

  const { content_diff, from_version, to_version } = compare

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompareArrowsIcon className="size-5 text-primary" />
            Perbandingan Isi Dokumen
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XIcon className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="font-medium text-muted-foreground">Versi Awal</p>
            <p className="font-semibold">V{from_version.version_number}</p>
            <p className="text-muted-foreground truncate">{from_version.original_file_name}</p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="font-medium text-muted-foreground">Versi Tujuan</p>
            <p className="font-semibold">V{to_version.version_number}</p>
            <p className="text-muted-foreground truncate">{to_version.original_file_name}</p>
          </div>
        </div>

        <Separator />

        {/* Stats Toggle */}
        {showStats && content_diff.line_changes && (
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
              <p className="text-2xl font-bold text-emerald-600">
                +{content_diff.line_changes.stats.added}
              </p>
              <p className="text-xs text-emerald-700">Baris ditambah</p>
            </div>
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2">
              <p className="text-2xl font-bold text-rose-600">
                -{content_diff.line_changes.stats.deleted}
              </p>
              <p className="text-xs text-rose-700">Baris dihapus</p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
              <p className="text-2xl font-bold text-amber-600">
                ~{content_diff.line_changes.stats.modified}
              </p>
              <p className="text-xs text-amber-700">Baris diubah</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
              <p className="text-2xl font-bold text-slate-600">
                {content_diff.line_changes.stats.unchanged}
              </p>
              <p className="text-xs text-slate-700">Tidak berubah</p>
            </div>
          </div>
        )}

        {/* Summary */}
        {content_diff.line_changes && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p>
              <strong>Ringkasan Perubahan:</strong>{" "}
              Dari {content_diff.line_changes.old_line_count} baris menjadi{" "}
              {content_diff.line_changes.new_line_count} baris
              {content_diff.line_changes.net_change > 0
                ? ` (+${content_diff.line_changes.net_change})`
                : content_diff.line_changes.net_change < 0
                  ? ` (${content_diff.line_changes.net_change})`
                  : " (tidak berubah)"}
            </p>
          </div>
        )}

        {/* Diff Content */}
        {content_diff.can_diff_content && content_diff.diff_html ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Perbandingan Side-by-Side</p>
            </div>
            <div
              className="border rounded-lg overflow-auto max-h-[500px] text-sm"
              dangerouslySetInnerHTML={{ __html: content_diff.diff_html }}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6 text-center">
            <p className="text-muted-foreground text-sm">
              {content_diff.message ||
                "Tidak dapat menampilkan perbandingan konten untuk jenis file ini."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-left text-xs">
              <div className="rounded bg-muted p-3">
                <p className="font-medium mb-1">Versi Awal:</p>
                <p>{content_diff.from_content_preview.character_count} karakter</p>
                <p>{content_diff.from_content_preview.lines_count} baris</p>
              </div>
              <div className="rounded bg-muted p-3">
                <p className="font-medium mb-1">Versi Tujuan:</p>
                <p>{content_diff.to_content_preview.character_count} karakter</p>
                <p>{content_diff.to_content_preview.lines_count} baris</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}