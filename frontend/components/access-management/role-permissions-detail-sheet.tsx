"use client"

import * as React from "react"
import { ShieldCheckIcon } from "lucide-react"

import { buildPermissionModuleGroups } from "@/lib/access-management/permissions"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type AccessManagementOption = {
  guard_name: string
  id: number
  name: string
}

type RolePermissionsDetailSheetProps = {
  permissions: AccessManagementOption[]
  roleName: string
  triggerMode?: "default" | "icon"
  triggerTestId: string
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function RolePermissionsDetailSheet({
  permissions,
  roleName,
  triggerMode = "default",
  triggerTestId,
}: RolePermissionsDetailSheetProps) {
  const modules = React.useMemo(() => buildPermissionModuleGroups(permissions), [permissions])
  const triggerLabel = `Lihat detail izin akses untuk peran ${roleName}`

  const trigger = triggerMode === "icon" ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <SheetTrigger asChild>
          <Button aria-label={triggerLabel} data-testid={triggerTestId} size="icon-sm" type="button" variant="outline">
            <ShieldCheckIcon aria-hidden data-icon="inline-start" />
          </Button>
        </SheetTrigger>
      </TooltipTrigger>
      <TooltipContent side="top">Detail izin akses</TooltipContent>
    </Tooltip>
  ) : (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground">{pluralize(permissions.length, "izin akses", "izin akses")}</span>
        <span className="text-sm text-muted">
          {modules.length
            ? `${pluralize(modules.length, "modul aktif", "modul aktif")} terhubung ke peran ini.`
            : "Belum ada izin akses yang ditetapkan untuk peran ini."}
        </span>
      </div>

      <SheetTrigger asChild>
        <Button data-testid={triggerTestId} size="sm" type="button" variant="outline">
          Lihat detail izin
        </Button>
      </SheetTrigger>
    </div>
  )

  return (
    <Sheet>
      {trigger}

      <SheetContent className="w-full sm:max-w-xl" side="right">
        <SheetHeader className="border-b border-line/80 pr-12">
          <SheetTitle>Detail izin akses</SheetTitle>
          <SheetDescription>
            Ringkasan izin akses untuk peran {roleName}. Daftar ini dikelompokkan per modul agar lebih cepat dipindai.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          {modules.length ? (
            modules.map((moduleGroup, index) => (
              <div key={moduleGroup.moduleKey} className="flex flex-col gap-4">
                {index ? <Separator /> : null}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-foreground">{moduleGroup.moduleLabel}</h3>
                    <p className="text-sm text-muted">
                      {pluralize(moduleGroup.permissions.length, "izin", "izin")} di modul ini.
                    </p>
                  </div>
                  <span className="rounded-full border border-line bg-card-strong px-3 py-1 text-xs font-medium text-foreground">
                    {moduleGroup.permissions.length}
                  </span>
                </div>

                <div className="grid gap-3">
                  {moduleGroup.actionGroups.map((actionGroup) => (
                    <div key={`${moduleGroup.moduleKey}-${actionGroup.actionKey}`} className="rounded-2xl border border-line bg-card-strong px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-foreground">{actionGroup.actionLabel}</p>
                        <p className="text-sm text-muted">{actionGroup.permissions.map((permission) => permission.label).join(", ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-card-strong px-4 py-4 text-sm text-muted">
              Peran ini belum memiliki izin akses. Anda bisa menambahkannya dari halaman ubah peran.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
