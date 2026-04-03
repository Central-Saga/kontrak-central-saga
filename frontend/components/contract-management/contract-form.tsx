import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type ContractFormProps = {
  action: (formData: FormData) => Promise<void>
  clients: Array<{ id: number; company_name: string; client_code: string }>
  mode: "create" | "edit"
  values?: {
    client_id?: number
    contract_number?: string
    contract_title?: string
    project_name?: string
    contract_date?: string
    start_date?: string
    end_date?: string
    contract_value?: string | number
    project_scope?: string
    payment_scheme_summary?: string | null
    contract_status?: string
    notes?: string | null
  }
}

const statusOptions = [
  ["draft", "Draft"],
  ["active", "Aktif"],
  ["completed", "Selesai"],
  ["terminated", "Dihentikan"],
  ["expired", "Kedaluwarsa"],
  ["cancelled", "Dibatalkan"],
] as const

export function ContractForm({ action, clients, mode, values }: ContractFormProps) {
  const isCreate = mode === "create"

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>{isCreate ? "Tambah kontrak baru" : "Perbarui data kontrak"}</CardTitle>
        <CardDescription>
          Susun identitas kontrak, proyek, dan status operasional dalam satu form yang langsung terhubung ke API backend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-7">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="contract-client">Klien</FieldLabel>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                data-testid="contract-form-client"
                defaultValue={values?.client_id ? String(values.client_id) : ""}
                id="contract-client"
                name="client_id"
                required
              >
                <option value="">Pilih klien</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.client_code} — {client.company_name}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-number">Nomor kontrak</FieldLabel>
              <Input data-testid="contract-form-number" defaultValue={values?.contract_number ?? ""} id="contract-number" name="contract_number" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-title">Judul kontrak</FieldLabel>
              <Input data-testid="contract-form-title" defaultValue={values?.contract_title ?? ""} id="contract-title" name="contract_title" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-project">Nama proyek</FieldLabel>
              <Input data-testid="contract-form-project" defaultValue={values?.project_name ?? ""} id="contract-project" name="project_name" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-date">Tanggal kontrak</FieldLabel>
              <Input data-testid="contract-form-date" defaultValue={values?.contract_date ?? ""} id="contract-date" name="contract_date" required type="date" />
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-start-date">Tanggal mulai</FieldLabel>
              <Input data-testid="contract-form-start-date" defaultValue={values?.start_date ?? ""} id="contract-start-date" name="start_date" required type="date" />
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-end-date">Tanggal selesai</FieldLabel>
              <Input data-testid="contract-form-end-date" defaultValue={values?.end_date ?? ""} id="contract-end-date" name="end_date" required type="date" />
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-value">Nilai kontrak</FieldLabel>
              <Input data-testid="contract-form-value" defaultValue={String(values?.contract_value ?? "")} id="contract-value" name="contract_value" required type="number" />
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-status">Status kontrak</FieldLabel>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                data-testid="contract-form-status"
                defaultValue={values?.contract_status ?? "draft"}
                id="contract-status"
                name="contract_status"
              >
                {statusOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-payment-scheme">Ringkasan skema pembayaran</FieldLabel>
              <Input data-testid="contract-form-payment-scheme" defaultValue={values?.payment_scheme_summary ?? ""} id="contract-payment-scheme" name="payment_scheme_summary" />
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-scope">Ruang lingkup proyek</FieldLabel>
              <Input data-testid="contract-form-scope" defaultValue={values?.project_scope ?? ""} id="contract-scope" name="project_scope" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="contract-notes">Catatan</FieldLabel>
              <Input data-testid="contract-form-notes" defaultValue={values?.notes ?? ""} id="contract-notes" name="notes" />
              <FieldDescription>Gunakan catatan untuk konteks operasional penting yang perlu terbaca cepat oleh tim.</FieldDescription>
            </Field>
          </FieldGroup>

          <div className="flex flex-wrap items-center gap-3">
            <Button data-testid="contract-form-submit" size="lg" type="submit">{isCreate ? "Simpan kontrak" : "Simpan perubahan"}</Button>
            <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/app/contracts">Batal</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
