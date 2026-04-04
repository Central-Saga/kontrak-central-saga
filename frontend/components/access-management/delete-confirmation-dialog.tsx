"use client"

import type * as React from "react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type DeleteConfirmationDialogProps = {
  action: () => Promise<void>
  cancelLabel?: string
  confirmLabel?: string
  confirmTestId?: string
  description: string
  title: string
  tooltipLabel?: string
  children: React.ReactElement
}

export function DeleteConfirmationDialog({
  action,
  cancelLabel = "Batal",
  confirmLabel = "Ya, hapus",
  confirmTestId,
  description,
  title,
  tooltipLabel,
  children,
}: DeleteConfirmationDialogProps) {
  const trigger = <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>

  return (
    <AlertDialog>
      {tooltipLabel ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="top">{tooltipLabel}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline">
              {cancelLabel}
            </Button>
          </AlertDialogCancel>

          <form action={action}>
            <AlertDialogAction asChild>
              <Button data-testid={confirmTestId} type="submit" variant="destructive">
                {confirmLabel}
              </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
