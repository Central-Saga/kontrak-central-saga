"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Contract = {
  id: number
  contract_number: string
  contract_title: string
}

type ProjectProgressFiltersProps = {
  contracts: Contract[]
  contractId?: number
  statusFilter: string
}

const progressStatusLabels: Record<string, string> = {
  not_started: "Belum mulai",
  in_progress: "Berjalan",
  on_hold: "Tertahan",
  delayed: "Terlambat",
  completed: "Selesai",
}

export function ProjectProgressFilters({ contracts, contractId, statusFilter }: ProjectProgressFiltersProps) {
  const [contractValue, setContractValue] = useState(contractId ? String(contractId) : "all")
  const [statusValue, setStatusValue] = useState(statusFilter || "all")

  return (
    <form
      action="/app/project-progress"
      className="flex w-full flex-col gap-3 xl:flex-row"
      method="GET"
    >
      <input name="contract_id" type="hidden" value={contractValue === "all" ? "" : contractValue} />
      <input name="progress_status" type="hidden" value={statusValue === "all" ? "" : statusValue} />
      <div className="relative w-full xl:max-w-80">
        <Select value={contractValue || "all"} onValueChange={setContractValue}>
          <SelectTrigger className="w-full" data-testid="project-progress-contract-filter">
            <SelectValue placeholder="Semua kontrak" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Semua kontrak</SelectItem>
              {contracts.map((contract) => (
                <SelectItem key={contract.id} value={String(contract.id)}>
                  {contract.contract_number} — {contract.contract_title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="relative w-full xl:max-w-56">
        <Select value={statusValue || "all"} onValueChange={setStatusValue}>
          <SelectTrigger className="w-full" data-testid="project-progress-status-filter">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Semua status</SelectItem>
              {Object.entries(progressStatusLabels).map(([value, label]) => (
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
        Terapkan
      </button>
    </form>
  )
}
