"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { EyeIcon, HistoryIcon, PencilLineIcon, Trash2Icon } from "lucide-react"

import { DeleteConfirmationDialog } from "@/components/access-management/delete-confirmation-dialog"
import { buttonVariants } from "@/components/ui/button"

type RowActionButtonsProps = {
  canDelete?: boolean
  canEdit?: boolean
  deleteAction: () => Promise<void>
  deleteLabel: string
  deleteTestId: string
  editHref: string
  editLabel: string
  editTestId: string
  leadingActions?: ReactNode
  historyHref?: string
  historyLabel?: string
  historyTestId?: string
  viewHref?: string
  viewLabel?: string
  viewTestId?: string
}

type ActionLinkButtonProps = {
  href: string
  icon: ReactNode
  label: string
  testId?: string
  tooltipLabel: string
}

function ActionLinkButton({ href, icon, label, testId, tooltipLabel }: ActionLinkButtonProps) {
  return (
    <Link
      aria-label={label}
      title={tooltipLabel}
      className={buttonVariants({ size: "icon-sm", variant: "outline" })}
      data-testid={testId}
      href={href}
    >
      {icon}
    </Link>
  )
}

export function RowActionButtons({
  canDelete = true,
  canEdit = true,
  deleteAction,
  deleteLabel,
  deleteTestId,
  editHref,
  editLabel,
  editTestId,
  leadingActions,
  historyHref,
  historyLabel,
  historyTestId,
  viewHref,
  viewLabel,
  viewTestId,
}: RowActionButtonsProps) {
  return (
    <div className="flex flex-nowrap items-center gap-2">
      {leadingActions}

      {viewHref && viewLabel ? (
        <ActionLinkButton
          href={viewHref}
          icon={<EyeIcon aria-hidden data-icon="inline-start" />}
          label={viewLabel}
          testId={viewTestId}
          tooltipLabel="Lihat detail"
        />
      ) : null}

      {canEdit ? (
        <ActionLinkButton
          href={editHref}
          icon={<PencilLineIcon aria-hidden data-icon="inline-start" />}
          label={editLabel}
          testId={editTestId}
          tooltipLabel="Ubah"
        />
      ) : null}

      {canDelete ? (
        <DeleteConfirmationDialog
          action={deleteAction}
          confirmTestId={`${deleteTestId}-confirm`}
          description="Data yang dipilih akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
          title="Hapus data ini?"
          tooltipLabel="Hapus"
          triggerButtonProps={{
            "aria-label": deleteLabel,
            "data-testid": deleteTestId,
            size: "icon-sm",
            variant: "destructive",
          }}
        >
          <Trash2Icon aria-hidden data-icon="inline-start" />
        </DeleteConfirmationDialog>
      ) : null}

      {historyHref && historyLabel ? (
        <ActionLinkButton
          href={historyHref}
          icon={<HistoryIcon aria-hidden data-icon="inline-start" />}
          label={historyLabel}
          testId={historyTestId}
          tooltipLabel="Riwayat dokumen"
        />
      ) : null}
    </div>
  )
}