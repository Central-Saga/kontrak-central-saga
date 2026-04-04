"use client"

import Link from "next/link"
import { EyeIcon, HistoryIcon, PencilLineIcon, Trash2Icon } from "lucide-react"

import { DeleteConfirmationDialog } from "@/components/access-management/delete-confirmation-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type RowActionButtonsProps = {
  deleteAction: () => Promise<void>
  deleteLabel: string
  deleteTestId: string
  editHref: string
  editLabel: string
  editTestId: string
  historyHref?: string
  historyLabel?: string
  historyTestId?: string
  viewHref?: string
  viewLabel?: string
  viewTestId?: string
}

export function RowActionButtons({
  deleteAction,
  deleteLabel,
  deleteTestId,
  editHref,
  editLabel,
  editTestId,
  historyHref,
  historyLabel,
  historyTestId,
  viewHref,
  viewLabel,
  viewTestId,
}: RowActionButtonsProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-nowrap items-center gap-2">
        {viewHref && viewLabel ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                aria-label={viewLabel}
                className={buttonVariants({ size: "icon-sm", variant: "outline" })}
                data-testid={viewTestId}
                href={viewHref}
              >
                <EyeIcon aria-hidden data-icon="inline-start" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">Lihat detail</TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              aria-label={editLabel}
              className={buttonVariants({ size: "icon-sm", variant: "outline" })}
              data-testid={editTestId}
              href={editHref}
            >
              <PencilLineIcon aria-hidden data-icon="inline-start" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top">Ubah</TooltipContent>
        </Tooltip>

        <DeleteConfirmationDialog
          action={deleteAction}
          confirmTestId={`${deleteTestId}-confirm`}
          description="Data yang dipilih akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
          title="Hapus data ini?"
          tooltipLabel="Hapus"
        >
          <Button aria-label={deleteLabel} data-testid={deleteTestId} size="icon-sm" type="button" variant="destructive">
            <Trash2Icon aria-hidden data-icon="inline-start" />
          </Button>
        </DeleteConfirmationDialog>

        {historyHref && historyLabel ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                aria-label={historyLabel}
                className={buttonVariants({ size: "icon-sm", variant: "outline" })}
                data-testid={historyTestId}
                href={historyHref}
              >
                <HistoryIcon aria-hidden data-icon="inline-start" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">Riwayat dokumen</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
