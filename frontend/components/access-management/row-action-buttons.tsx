"use client"

import Link from "next/link"
import { PencilLineIcon, Trash2Icon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type RowActionButtonsProps = {
  deleteAction: () => Promise<void>
  deleteLabel: string
  deleteTestId: string
  editHref: string
  editLabel: string
  editTestId: string
}

export function RowActionButtons({
  deleteAction,
  deleteLabel,
  deleteTestId,
  editHref,
  editLabel,
  editTestId,
}: RowActionButtonsProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-wrap gap-2">
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

        <form action={deleteAction}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label={deleteLabel} data-testid={deleteTestId} size="icon-sm" type="submit" variant="destructive">
                <Trash2Icon aria-hidden data-icon="inline-start" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Hapus</TooltipContent>
          </Tooltip>
        </form>
      </div>
    </TooltipProvider>
  )
}
