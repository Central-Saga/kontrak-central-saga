import Link from "next/link"
import { EyeIcon, Trash2Icon } from "lucide-react"

import { DeleteConfirmationDialog } from "@/components/access-management/delete-confirmation-dialog"
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { EmptyStateCard, PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  deletePaymentTermStandaloneAction,
} from "@/app/(app)/app/access-management/actions"
import { listContracts, listPaymentTerms, type PaymentTermRecord } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page"
import { hasAnyPermission } from "@/lib/auth/permissions"
import { readSessionState } from "@/lib/auth/session"
import type { AuthUser } from "@/lib/auth/types"

const statusMessages = {
  payment_term_created: "Termin pembayaran baru berhasil ditambahkan.",
  payment_term_updated: "Termin pembayaran berhasil diperbarui.",
  payment_term_deleted: "Termin pembayaran berhasil dihapus.",
}

const paymentTermStatusLabels: Record<string, string> = {
  pending: "Menunggu",
  upcoming: "Akan datang",
  paid: "Lunas",
  partially_paid: "Terbayar sebagian",
  overdue: "Jatuh tempo",
  cancelled: "Dibatalkan",
}

const statusPillClassName = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"

function PaymentTermStatusPill({ status }: { status: string }) {
  const palette =
    status === "paid"
      ? "border-primary/20 bg-primary/10 text-primary"
      : status === "partially_paid" || status === "upcoming"
        ? "border-highlight/20 bg-accent-soft text-secondary-foreground"
        : status === "overdue" || status === "cancelled"
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-line bg-card-strong text-muted"

  return <span className={`${statusPillClassName} ${palette}`}>{paymentTermStatusLabels[status] ?? status}</span>
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date)
}

function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value
  if (Number.isNaN(amount)) return String(value)
  return new Intl.NumberFormat("id-ID", { currency: "IDR", maximumFractionDigits: 0, style: "currency" }).format(amount)
}

export default async function PaymentTermsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams
  const status = readSearchParam(resolvedSearchParams, "status")
  const error = readSearchParam(resolvedSearchParams, "error")

  const session = await readSessionState()
  const user: AuthUser | null = session.status === "authenticated" ? session.user : null
  const canCreate = user ? hasAnyPermission(user, ["manage payment terms", "create payment terms"]) : false
  const canDelete = user ? hasAnyPermission(user, ["manage payment terms", "delete payment terms"]) : false

  let paymentTerms = null
  let contracts = [] as Awaited<ReturnType<typeof listContracts>>["data"]
  let message: string | null = null

  try {
    const [paymentTermsResponse, contractsResponse] = await Promise.all([
      listPaymentTerms({ perPage: 100 }),
      listContracts({ perPage: 100 }),
    ])
    paymentTerms = paymentTermsResponse
    contracts = contractsResponse.data
  } catch (fetchError) {
    message = handleModulePageError(fetchError)
  }

  const contractMap = new Map(contracts.map((c) => [c.id, c]))

  return (
    <PageStack data-testid="payment-terms-list-page">
      <PageHeaderCard
        actionHref={canCreate ? "/app/payment-terms/new" : undefined}
        actionLabel={canCreate ? "Tambah termin" : undefined}
        description="Kelola jadwal termin pembayaran dari seluruh kontrak dalam satu daftar terpusat."
        title="Kelola termin pembayaran"
        eyebrow="Manajemen termin"
      />

      <StatusToastBridge error={error ?? undefined} messages={statusMessages} status={status} />
      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Daftar termin pembayaran</CardTitle>
            <CardDescription>
              Termin pembayaran dari seluruh kontrak dikemas dalam satu tabel agar tim keuangan bisa memantau jadwal penagihan.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {paymentTerms && paymentTerms.data.length > 0 ? (
            <div className="overflow-hidden rounded-3xl border border-line">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      <th className="w-[15%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Kontrak</th>
                      <th className="w-[10%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Termin</th>
                      <th className="w-[20%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Judul</th>
                      <th className="w-[12%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Jatuh Tempo</th>
                      <th className="w-[15%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Nilai</th>
                      <th className="w-[12%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Status</th>
                      <th className="w-[16%] border border-line bg-card-strong px-4 py-3 font-medium text-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentTerms.data.map((term: PaymentTermRecord) => {
                      const deleteAction = deletePaymentTermStandaloneAction.bind(null, term.id)
                      const contract = contractMap.get(term.contract_id)

                      return (
                        <tr key={term.id}>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <div className="flex flex-col gap-1">
                              <p className="font-medium text-foreground">{contract?.contract_number ?? `Kontrak #${term.contract_id}`}</p>
                              <p className="text-xs text-muted">{contract?.contract_title ?? "-"}</p>
                            </div>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <span className="rounded-full border border-line bg-card-strong px-3 py-1 text-xs font-mono">
                              Termin {term.term_number}
                            </span>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <p className="font-medium text-foreground">{term.term_title}</p>
                            {term.description ? <p className="text-xs text-muted">{term.description}</p> : null}
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <p className="text-sm text-foreground">{formatDate(term.due_date)}</p>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <p className="text-sm font-medium text-foreground">{formatCurrency(term.amount)}</p>
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <PaymentTermStatusPill status={term.status} />
                          </td>
                          <td className="border border-line px-4 py-3.5 align-top">
                            <div className="flex flex-nowrap items-center gap-2">
                              <Link
                                aria-label={`Lihat detail kontrak ${contract?.contract_number ?? term.contract_id}`}
                                className={buttonVariants({ size: "icon-sm", variant: "outline" })}
                                href={`/app/contracts/${term.contract_id}`}
                              >
                                <EyeIcon aria-hidden data-icon="inline-start" />
                              </Link>
                              {canDelete ? (
                                <DeleteConfirmationDialog
                                  action={deleteAction}
                                  description="Termin pembayaran ini akan dihapus permanen."
                                  title="Hapus termin pembayaran?"
                                  tooltipLabel="Hapus termin"
                                >
                                  <Button aria-label={`Hapus termin ${term.term_number}`} size="icon-sm" type="button" variant="destructive">
                                    <Trash2Icon aria-hidden data-icon="inline-start" />
                                  </Button>
                                </DeleteConfirmationDialog>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyStateCard
              description="Termin pembayaran baru akan muncul di sini setelah dibuat dari halaman detail kontrak."
              title="Belum ada termin pembayaran"
            />
          )}
        </CardContent>
      </Card>
    </PageStack>
  )
}
