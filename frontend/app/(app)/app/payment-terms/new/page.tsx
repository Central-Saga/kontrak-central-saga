import Link from "next/link"

import { createPaymentTermStandaloneAction } from "@/app/(app)/app/access-management/actions"
import { PageHeaderCard, PageStack, StatusBanner } from "@/components/access-management/shared"
import { StatusToastBridge } from "@/components/access-management/status-toast-bridge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { listContracts } from "@/lib/access-management/backend"
import { handleModulePageError, readSearchParam, type PageSearchParams } from "@/lib/access-management/page"

const selectClassName = "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"

const termStatusOptions = [
  ["pending", "Menunggu"],
  ["upcoming", "Akan datang"],
  ["overdue", "Jatuh tempo"],
  ["paid", "Lunas"],
  ["partially_paid", "Terbayar sebagian"],
  ["cancelled", "Dibatalkan"],
] as const

export default async function NewPaymentTermPage({ searchParams }: { searchParams: PageSearchParams }) {
  const resolvedSearchParams = await searchParams
  const error = readSearchParam(resolvedSearchParams, "error")

  let contracts = [] as Awaited<ReturnType<typeof listContracts>>["data"]
  let message: string | null = null

  try {
    const response = await listContracts({ perPage: 100 })
    contracts = response.data
  } catch (fetchError) {
    message = handleModulePageError(fetchError)
  }

  return (
    <PageStack>
      <PageHeaderCard
        description="Buat jadwal termin pembayaran dengan memilih kontrak sebagai induk datanya."
        eyebrow="Manajemen termin"
        title="Tambah termin pembayaran"
      />

      <StatusToastBridge error={error ?? undefined} />
      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Data termin baru</CardTitle>
          <CardDescription>
            Termin pembayaran harus terhubung ke satu kontrak agar nilai, jatuh tempo, dan statusnya tetap konsisten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPaymentTermStandaloneAction} className="flex flex-col gap-7">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="payment-term-contract">Kontrak</FieldLabel>
                <select
                  className={selectClassName}
                  disabled={!contracts.length}
                  id="payment-term-contract"
                  name="contract_id"
                  required
                >
                  <option value="">Pilih kontrak</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.contract_number} - {contract.contract_title}
                    </option>
                  ))}
                </select>
                <FieldDescription>Daftar ini mengambil kontrak dari backend sebagai sumber data utama.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="payment-term-number">Nomor termin</FieldLabel>
                <Input id="payment-term-number" min="1" name="term_number" required type="number" />
              </Field>

              <Field>
                <FieldLabel htmlFor="payment-term-title">Judul termin</FieldLabel>
                <Input id="payment-term-title" name="term_title" placeholder="DP proyek, Termin 1, Final payment" required />
              </Field>

              <Field>
                <FieldLabel htmlFor="payment-term-due-date">Tanggal jatuh tempo</FieldLabel>
                <Input id="payment-term-due-date" name="due_date" required type="date" />
              </Field>

              <Field>
                <FieldLabel htmlFor="payment-term-amount">Nilai termin</FieldLabel>
                <Input id="payment-term-amount" min="0" name="amount" required step="0.01" type="number" />
              </Field>

              <Field>
                <FieldLabel htmlFor="payment-term-status">Status termin</FieldLabel>
                <select className={selectClassName} defaultValue="pending" id="payment-term-status" name="status">
                  {termStatusOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="payment-term-condition">Syarat bayar</FieldLabel>
                <Input id="payment-term-condition" name="payable_after_condition" placeholder="Setelah BAST / invoice terbit" />
              </Field>

              <Field>
                <FieldLabel htmlFor="payment-term-description">Keterangan</FieldLabel>
                <Textarea id="payment-term-description" name="description" placeholder="Rincian termin pembayaran" />
              </Field>
            </FieldGroup>

            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!contracts.length} size="lg" type="submit">
                Simpan termin
              </Button>
              <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/app/payment-terms">
                Batal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageStack>
  )
}
