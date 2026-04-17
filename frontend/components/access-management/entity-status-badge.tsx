import { cn } from "@/lib/utils"

const clientStatusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: "Aktif",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  inactive: {
    label: "Tidak aktif",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
}

const contractStatusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: "Aktif",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  completed: {
    label: "Selesai",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  draft: {
    label: "Draft",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  expired: {
    label: "Kedaluwarsa",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  terminated: {
    label: "Dihentikan",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
}

function StatusBadge({
  className,
  label,
}: {
  className: string
  label: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.01em]",
        className,
      )}
    >
      {label}
    </span>
  )
}

export function ClientStatusBadge({ status }: { status: string }) {
  const config = clientStatusConfig[status] ?? {
    label: status,
    className: "border-slate-200 bg-slate-100 text-slate-700",
  }

  return <StatusBadge className={config.className} label={config.label} />
}

export function ContractStatusBadge({ status }: { status: string }) {
  const config = contractStatusConfig[status] ?? {
    label: status,
    className: "border-slate-200 bg-slate-100 text-slate-700",
  }

  return <StatusBadge className={config.className} label={config.label} />
}
