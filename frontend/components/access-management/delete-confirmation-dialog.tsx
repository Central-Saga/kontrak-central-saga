"use client"

import type * as React from "react"

import { Button, buttonVariants } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

type ButtonStyleProps = Omit<React.ComponentProps<typeof Button>, "children" | "type" | "asChild"> & {
  "data-testid"?: string
}

type DeleteConfirmationDialogProps = {
  action: () => Promise<void>
  cancelLabel?: string
  confirmLabel?: string
  confirmTestId?: string
  description: string
  title: string
  triggerButtonProps?: ButtonStyleProps
  triggerLabel?: React.ReactNode
  tooltipLabel?: string
  children?: React.ReactNode
}

export function DeleteConfirmationDialog({
  action,
  cancelLabel = "Batal",
  confirmLabel = "Ya, hapus",
  confirmTestId,
  description,
  title,
  triggerButtonProps,
  triggerLabel,
  tooltipLabel,
  children,
}: DeleteConfirmationDialogProps) {
  const variant = triggerButtonProps?.variant ?? "destructive"
  const size = triggerButtonProps?.size
  const ariaLabel = triggerButtonProps?.["aria-label"]
  const testId = triggerButtonProps?.["data-testid"]
  const className = triggerButtonProps?.className
  const triggerContent = children ?? triggerLabel ?? "Hapus"

  return (
    <AlertDialog>
      <AlertDialogTrigger
        type="button"
        aria-label={ariaLabel}
        data-testid={testId}
        title={tooltipLabel}
        className={cn(buttonVariants({ variant, size }), className)}
      >
        {triggerContent}
      </AlertDialogTrigger>

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
