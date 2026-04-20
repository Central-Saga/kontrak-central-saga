"use client"

import type { ReactNode } from "react"
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Link aria-label={label} className={buttonVariants({ size: "icon-sm", variant: "outline" })} data-testid={testId} href={href}>
          {icon}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipLabel}</TooltipContent>
    </Tooltip>
  )
}

export function RowActionButtons({
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
    <TooltipProvider delayDuration={0}>
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

        <ActionLinkButton
          href={editHref}
          icon={<PencilLineIcon aria-hidden data-icon="inline-start" />}
          label={editLabel}
          testId={editTestId}
          tooltipLabel="Ubah"
        />

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
          <ActionLinkButton
            href={historyHref}
            icon={<HistoryIcon aria-hidden data-icon="inline-start" />}
            label={historyLabel}
            testId={historyTestId}
            tooltipLabel="Riwayat dokumen"
          />
        ) : null}
      </div>
    </TooltipProvider>
  )
}
