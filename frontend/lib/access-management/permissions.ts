type PermissionOption = {
  id: number
  name: string
  guard_name: string
}

export type ParsedPermissionName = {
  action: string
  module: string
}

export type PermissionDisplay = {
  actionKey: string
  actionLabel: string
  description: string
  guardName: string
  id: number
  identifier: string
  label: string
  moduleKey: string
  moduleLabel: string
}

export type PermissionActionGroup = {
  actionKey: string
  actionLabel: string
  permissions: PermissionDisplay[]
}

export type PermissionModuleGroup = {
  actionGroups: PermissionActionGroup[]
  moduleKey: string
  moduleLabel: string
  permissions: PermissionDisplay[]
}

const actionLabels: Record<string, string> = {
  access: "Akses",
  create: "Buat",
  delete: "Hapus",
  export: "Ekspor",
  manage: "Kelola",
  read: "Baca",
  update: "Ubah",
  upload: "Unggah",
  verify: "Verifikasi",
  verification: "Verifikasi",
  view: "Lihat",
}

const modulePhraseLabels: Record<string, string> = {
  "activity logs": "log aktivitas",
  "client portal": "portal klien",
  clients: "klien",
  contracts: "kontrak",
  "payment proofs": "bukti pembayaran",
  "payment terms": "termin pembayaran",
  payments: "pembayaran",
  permissions: "izin akses",
  "project progress": "progres proyek",
  "reporting dashboard": "dashboard pelaporan",
  reports: "laporan",
  roles: "peran",
  settings: "pengaturan",
  users: "pengguna",
}

const moduleWordLabels: Record<string, string> = {
  account: "akun",
  accounts: "akun",
  activity: "aktivitas",
  approval: "persetujuan",
  approvals: "persetujuan",
  client: "klien",
  clients: "klien",
  contract: "kontrak",
  contracts: "kontrak",
  credit: "kredit",
  credits: "kredit",
  dashboard: "dasbor",
  document: "dokumen",
  documents: "dokumen",
  export: "ekspor",
  exports: "ekspor",
  invoice: "invoice",
  invoices: "invoice",
  log: "log",
  logs: "log",
  note: "nota",
  notes: "nota",
  portal: "portal",
  proof: "bukti",
  proofs: "bukti",
  payment: "pembayaran",
  payments: "pembayaran",
  permission: "izin akses",
  permissions: "izin akses",
  profile: "profil",
  progress: "progres",
  project: "proyek",
  report: "laporan",
  reporting: "pelaporan",
  reports: "laporan",
  role: "peran",
  roles: "peran",
  setting: "pengaturan",
  settings: "pengaturan",
  term: "termin",
  terms: "termin",
  user: "pengguna",
  users: "pengguna",
}

const actionSortOrder = ["access", "view", "read", "create", "update", "manage", "verify", "verification", "upload", "export", "delete"]

function capitalizeWords(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function translateModule(moduleKey: string) {
  const normalizedModule = moduleKey.trim().toLowerCase()
  const directMatch = modulePhraseLabels[normalizedModule]

  if (directMatch) {
    return directMatch
  }

  return normalizedModule
    .split(" ")
    .filter(Boolean)
    .map((segment) => moduleWordLabels[segment] ?? segment)
    .join(" ")
}

function getActionSortWeight(actionKey: string) {
  const actionIndex = actionSortOrder.indexOf(actionKey)

  return actionIndex === -1 ? actionSortOrder.length : actionIndex
}

export function parsePermissionName(name: string): ParsedPermissionName {
  const [action, ...moduleParts] = name.trim().split(" ")

  return {
    action: action ?? "-",
    module: moduleParts.join(" ") || name,
  }
}

export function humanizePermissionName(name: string) {
  const parsed = parsePermissionName(name)
  const moduleText = translateModule(parsed.module)
  const actionLabel = actionLabels[parsed.action] ?? capitalizeWords(parsed.action)

  return `${actionLabel} ${moduleText}`.trim()
}

export function buildPermissionModuleGroups(permissions: PermissionOption[]): PermissionModuleGroup[] {
  const modules = new Map<string, PermissionModuleGroup>()

  for (const permission of permissions) {
    const parsed = parsePermissionName(permission.name)
    const moduleKey = parsed.module.toLowerCase()
    const actionKey = parsed.action.toLowerCase()
    const moduleLabel = capitalizeWords(translateModule(parsed.module))
    const actionLabel = actionLabels[actionKey] ?? capitalizeWords(actionKey)
    const displayPermission: PermissionDisplay = {
      actionKey,
      actionLabel,
      description: `${actionLabel} pada modul ${moduleLabel.toLowerCase()} • Penjaga ${permission.guard_name}`,
      guardName: permission.guard_name,
      id: permission.id,
      identifier: permission.name,
      label: humanizePermissionName(permission.name),
      moduleKey,
      moduleLabel,
    }

    const moduleGroup = modules.get(moduleKey) ?? {
      actionGroups: [],
      moduleKey,
      moduleLabel,
      permissions: [],
    }

    moduleGroup.permissions.push(displayPermission)

    const actionGroup = moduleGroup.actionGroups.find((group) => group.actionKey === actionKey) ?? {
      actionKey,
      actionLabel,
      permissions: [],
    }

    actionGroup.permissions.push(displayPermission)

    if (!moduleGroup.actionGroups.find((group) => group.actionKey === actionKey)) {
      moduleGroup.actionGroups.push(actionGroup)
    }

    modules.set(moduleKey, moduleGroup)
  }

  return Array.from(modules.values())
    .sort((left, right) => left.moduleLabel.localeCompare(right.moduleLabel, "id"))
    .map((moduleGroup) => ({
      ...moduleGroup,
      permissions: moduleGroup.permissions.sort((left, right) => left.label.localeCompare(right.label, "id")),
      actionGroups: moduleGroup.actionGroups
        .sort((left, right) => {
          const actionWeightDifference = getActionSortWeight(left.actionKey) - getActionSortWeight(right.actionKey)

          if (actionWeightDifference !== 0) {
            return actionWeightDifference
          }

          return left.actionLabel.localeCompare(right.actionLabel, "id")
        })
        .map((actionGroup) => ({
          ...actionGroup,
          permissions: actionGroup.permissions.sort((left, right) => left.label.localeCompare(right.label, "id")),
        })),
    }))
}
