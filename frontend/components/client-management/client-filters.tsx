"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ClientFiltersProps = {
  search: string
  statusFilter: string
}

const clientStatusLabels: Record<string, string> = {
  active: "Aktif",
  inactive: "Tidak aktif",
}

export function ClientFilters({ search, statusFilter }: ClientFiltersProps) {
  const [statusValue, setStatusValue] = useState(statusFilter || "all")

  return (
    <form
      action="/app/clients"
      className="flex w-full flex-col gap-3 sm:flex-row"
      method="GET"
    >
      <Input
        data-testid="clients-search-input"
        defaultValue={search}
        name="search"
        placeholder="Cari kode atau nama klien"
      />
      <input name="client_status" type="hidden" value={statusValue === "all" ? "" : statusValue} />
      <div className="relative w-full sm:max-w-48">
        <Select value={statusValue || "all"} onValueChange={setStatusValue}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Semua status</SelectItem>
              {Object.entries(clientStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <button
        className="h-11 rounded-2xl border border-line px-4 text-sm font-medium text-foreground"
        type="submit"
      >
        Cari
      </button>
    </form>
  )
}
