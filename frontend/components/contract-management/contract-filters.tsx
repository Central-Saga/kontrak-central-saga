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

type Client = {
  id: number
  company_name: string
}

type ContractFiltersProps = {
  clients: Client[]
  search: string
  statusFilter: string
  clientId?: number
  showClientFilter?: boolean
}

const contractStatusLabels: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  completed: "Selesai",
  terminated: "Dihentikan",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
}

export function ContractFilters({ clients, search, statusFilter, clientId, showClientFilter = true }: ContractFiltersProps) {
  const [clientValue, setClientValue] = useState(clientId ? String(clientId) : "all")
  const [statusValue, setStatusValue] = useState(statusFilter || "all")

  return (
    <form
      action="/app/contracts"
      className="flex w-full flex-col gap-3 xl:flex-row"
      method="GET"
    >
      <Input
        data-testid="contracts-search-input"
        defaultValue={search}
        name="search"
        placeholder="Cari nomor, judul, atau nama proyek"
      />
      <input name="client_id" type="hidden" value={clientValue === "all" ? "" : clientValue} />
      <input name="contract_status" type="hidden" value={statusValue === "all" ? "" : statusValue} />
      <div className="relative w-full xl:max-w-56" hidden={!showClientFilter}>
        <Select
          value={clientValue}
          onValueChange={setClientValue}
          disabled={!showClientFilter}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter klien" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Semua klien</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={String(client.id)}>
                  {client.company_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="relative w-full xl:max-w-48">
        <Select
          value={statusValue || "all"}
          onValueChange={setStatusValue}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter status kontrak" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Semua status kontrak</SelectItem>
              {Object.entries(contractStatusLabels).map(([value, label]) => (
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
