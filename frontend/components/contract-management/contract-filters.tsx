"use client"

import { useRouter } from "next/navigation"
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
  const router = useRouter()

  const handleSearch = (formData: FormData) => {
    const params = new URLSearchParams()
    const searchValue = formData.get("search") as string
    const clientValue = formData.get("client_id") as string
    const statusValue = formData.get("contract_status") as string

    if (searchValue) params.set("search", searchValue)
    if (clientValue) params.set("client_id", clientValue)
    if (statusValue) params.set("contract_status", statusValue)

    router.push(`/app/contracts?${params.toString()}`)
  }

  return (
    <form
      action={handleSearch}
      className="flex w-full flex-col gap-3 xl:flex-row"
    >
      <Input
        data-testid="contracts-search-input"
        defaultValue={search}
        name="search"
        placeholder="Cari nomor, judul, atau nama proyek"
      />
      <div className="relative w-full xl:max-w-56" hidden={!showClientFilter}>
        <Select
          name="client_id"
          defaultValue={clientId ? String(clientId) : "all"}
          disabled={!showClientFilter}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua klien" />
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
        <Select name="contract_status" defaultValue={statusFilter || "all"}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Semua status</SelectItem>
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
