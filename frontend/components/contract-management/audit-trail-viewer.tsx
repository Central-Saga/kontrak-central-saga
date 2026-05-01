"use client"

import { useState } from "react"
import { HistoryIcon, UserIcon, CalendarIcon, ArrowRightLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { DocumentVersionAuditLogRecord, ContractDocumentVersionRecord } from "@/lib/access-management/backend"

interface AuditTrailViewerProps {
  version: ContractDocumentVersionRecord
  auditLogs?: DocumentVersionAuditLogRecord[]
  auditLogsError?: string | null
}

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

const actionLabels: Record<string, string> = {
  created: "Dibuat",
  updated: "Diperbarui",
  deleted: "Dihapus",
  viewed: "Dilihat",
  downloaded: "Diunduh",
  compared: "Dibandingkan",
  metadata_changed: "Metadata Diubah",
}

const fieldLabels: Record<string, string> = {
  version_status: "Status Versi",
  change_summary: "Ringkasan Perubahan",
  document_type: "Jenis Dokumen",
  original_file_name: "Nama File",
}

export function AuditTrailViewer({ version, auditLogs, auditLogsError }: AuditTrailViewerProps) {
  const [selectedLog, setSelectedLog] = useState<DocumentVersionAuditLogRecord | null>(null)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HistoryIcon className="size-5 text-primary" />
            Audit Trail untuk V{version.version_number}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogsError ? (
            <p className="text-sm text-destructive">{auditLogsError}</p>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <HistoryIcon className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada audit log untuk versi ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log, index) => (
                <Dialog key={log.id}>
                  <DialogTrigger asChild>
                    <div
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {index !== auditLogs.length - 1 && (
                          <div className="w-px h-full bg-border ml-1 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {actionLabels[log.action] || log.action}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(log.created_at)}
                          </span>
                        </div>
                        {log.user && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <UserIcon className="size-3" />
                            {log.user.name}
                          </p>
                        )}
                        {log.field_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Field: {fieldLabels[log.field_name] || log.field_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <HistoryIcon className="size-5" />
                        Detail Audit Log
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Aksi</p>
                          <p className="font-medium">{actionLabels[log.action] || log.action}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Waktu</p>
                          <p className="font-medium flex items-center gap-1">
                            <CalendarIcon className="size-4" />
                            {formatDateTime(log.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">User</p>
                          <p className="font-medium">
                            {log.user?.name || "System"} ({log.user?.email || "N/A"})
                          </p>
                        </div>
                        {log.field_name && (
                          <div>
                            <p className="text-sm text-muted-foreground">Field</p>
                            <p className="font-medium">
                              {fieldLabels[log.field_name] || log.field_name}
                            </p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {log.old_value !== null && log.new_value !== null && (
                        <div className="space-y-3">
                          <p className="font-medium flex items-center gap-2">
                            <ArrowRightLeftIcon className="size-4" />
                            Perubahan Nilai
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                              <p className="text-xs text-destructive font-medium mb-2">Nilai Lama</p>
                              <pre className="text-xs whitespace-pre-wrap break-all">
                                {log.old_value || "(kosong)"}
                              </pre>
                            </div>
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                              <p className="text-xs text-emerald-600 font-medium mb-2">Nilai Baru</p>
                              <pre className="text-xs whitespace-pre-wrap break-all">
                                {log.new_value || "(kosong)"}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {log.change_summary && (
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-sm text-muted-foreground mb-1">Ringkasan Perubahan</p>
                          <p className="text-sm">{log.change_summary}</p>
                        </div>
                      )}

                      {log.ip_address && (
                        <p className="text-xs text-muted-foreground">
                          IP Address: {log.ip_address}
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}