"use client"

import * as React from "react"

import type { PermissionModuleGroup } from "@/lib/access-management/permissions"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"

type RolePermissionsPanelProps = {
  modules: PermissionModuleGroup[]
  selectedPermissionIds: number[]
}

function uniqueIds(values: number[]) {
  return Array.from(new Set(values)).sort((left, right) => left - right)
}

export function RolePermissionsPanel({ modules, selectedPermissionIds }: RolePermissionsPanelProps) {
  const [selection, setSelection] = React.useState<number[]>(() => uniqueIds(selectedPermissionIds))

  const selectedIds = React.useMemo(() => new Set(selection), [selection])
  const allPermissionIds = React.useMemo(
    () => uniqueIds(modules.flatMap((moduleGroup) => moduleGroup.permissions.map((permission) => permission.id))),
    [modules]
  )

  const updateSelection = React.useCallback((nextSelection: number[]) => {
    setSelection(uniqueIds(nextSelection))
  }, [])

  const handleTogglePermission = React.useCallback(
    (permissionId: number, checked: boolean) => {
      if (checked) {
        updateSelection([...selection, permissionId])
        return
      }

      updateSelection(selection.filter((id) => id !== permissionId))
    },
    [selection, updateSelection]
  )

  const handleSelectAll = React.useCallback(() => {
    updateSelection(allPermissionIds)
  }, [allPermissionIds, updateSelection])

  const handleClearAll = React.useCallback(() => {
    updateSelection([])
  }, [updateSelection])

  const getModuleSelectionCount = React.useCallback(
    (permissionIds: number[]) => permissionIds.filter((permissionId) => selectedIds.has(permissionId)).length,
    [selectedIds]
  )

  if (!modules.length) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-card-strong px-4 py-4 text-sm text-muted">
        Belum ada izin akses yang bisa dipilih dari backend. Peran tetap bisa disimpan tanpa izin akses.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <input name="permission_ids_present" type="hidden" value="1" />
      {selection.map((permissionId) => (
        <input key={permissionId} name="permission_ids" type="hidden" value={permissionId} />
      ))}

      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-card-strong p-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-highlight">Ringkasan pilihan</p>
          <p className="text-3xl font-semibold text-foreground">{selection.length}</p>
          <p className="text-sm leading-6 text-muted">dari {allPermissionIds.length} izin sedang dipilih untuk peran ini.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button data-testid="role-permissions-select-all" size="sm" type="button" variant="outline" onClick={handleSelectAll}>
            Pilih semua izin
          </Button>
          <Button data-testid="role-permissions-clear-all" size="sm" type="button" variant="ghost" onClick={handleClearAll}>
            Kosongkan semua izin
          </Button>
        </div>
      </div>

      <Accordion defaultValue={modules.slice(0, 2).map((moduleGroup) => moduleGroup.moduleKey)} type="multiple">
        <div className="flex flex-col gap-4">
          {modules.map((moduleGroup) => {
            const modulePermissionIds = moduleGroup.permissions.map((permission) => permission.id)
            const selectedCount = getModuleSelectionCount(modulePermissionIds)

            return (
              <AccordionItem key={moduleGroup.moduleKey} value={moduleGroup.moduleKey}>
                <AccordionTrigger data-testid={`role-permissions-module-trigger-${moduleGroup.moduleKey}`}>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate">{moduleGroup.moduleLabel}</span>
                      <span className="text-sm font-normal text-muted">
                        {selectedCount} dari {moduleGroup.permissions.length} izin sedang dipilih.
                      </span>
                    </div>
                    <span className="rounded-full border border-line bg-background px-3 py-1 text-xs font-medium text-foreground">
                      {moduleGroup.permissions.length}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 border-t border-line/80 pt-4">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      data-testid={`role-permissions-module-select-all-${moduleGroup.moduleKey}`}
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => updateSelection([...selection, ...modulePermissionIds])}
                    >
                      Pilih semua modul ini
                    </Button>
                    <Button
                      data-testid={`role-permissions-module-clear-all-${moduleGroup.moduleKey}`}
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        updateSelection(selection.filter((permissionId) => !modulePermissionIds.includes(permissionId)))
                      }
                    >
                      Kosongkan modul ini
                    </Button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {moduleGroup.actionGroups.map((actionGroup) => (
                      <div key={`${moduleGroup.moduleKey}-${actionGroup.actionKey}`} className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">{actionGroup.actionLabel}</p>
                          <span className="text-xs text-muted">{actionGroup.permissions.length} izin</span>
                        </div>

                        <div className="grid gap-3 xl:grid-cols-2">
                          {actionGroup.permissions.map((permission) => {
                            const inputId = `permission_ids-${permission.id}`

                            return (
                              <Field
                                key={permission.id}
                                className="rounded-2xl border border-line bg-background/80 px-4 py-3"
                                orientation="horizontal"
                              >
                                <input
                                  checked={selectedIds.has(permission.id)}
                                  className="mt-1 size-4 rounded-sm border border-input accent-primary"
                                  id={inputId}
                                  type="checkbox"
                                  onChange={(event) => handleTogglePermission(permission.id, event.target.checked)}
                                />
                                <FieldContent>
                                  <FieldLabel htmlFor={inputId}>{permission.label}</FieldLabel>
                                  <FieldDescription>{permission.description}</FieldDescription>
                                </FieldContent>
                              </Field>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </div>
      </Accordion>
    </div>
  )
}
