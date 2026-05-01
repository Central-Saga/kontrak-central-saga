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

type ClientFiltersProps = {
  search: string
  statusFilter: string
}

const clientStatusLabels: Record<string, string> = {
  active: "Aktif",
  inactive: "Tidak aktif",
}

export function ClientFilters({ search, statusFilter }: ClientFiltersProps) {
  const router = useRouter()

  const handleSearch = (formData: FormData) => {
    const params = new URLSearchParams()
    const searchValue = formData.get("search") as string
    const statusValue = formData.get("client_status") as string

    if (searchValue) params.set("search", searchValue)
    if (statusValue) params.set("client_status", statusValue)

    router.push(`/app/clients?${params.toString()}`)
  }

  return (
    <form
      action={handleSearch}
      className="flex w-full flex-col gap-3 sm:flex-row"
    >
      <Input
        data-testid="clients-search-input"
        defaultValue={search}
        name="search"
        placeholder="Cari kode atau nama klien"
      />
      <div className="relative w-full sm:max-w-48">
        <Select name="client_status" defaultValue={statusFilter || "all"}>
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
