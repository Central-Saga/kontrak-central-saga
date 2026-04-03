import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type ClientFormProps = {
  action: (formData: FormData) => Promise<void>
  mode: "create" | "edit"
  values?: {
    address?: string | null
    client_code?: string
    company_name?: string
    contact_person?: string | null
    email?: string | null
    phone?: string | null
    portal_access_enabled?: boolean
    status?: string
  }
}

const statusOptions = [
  { label: "Aktif", value: "active" },
  { label: "Tidak aktif", value: "inactive" },
]

export function ClientForm({ action, mode, values }: ClientFormProps) {
  const isCreate = mode === "create"

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>{isCreate ? "Tambah klien baru" : "Perbarui data klien"}</CardTitle>
        <CardDescription>
          Simpan informasi identitas klien melalui server action agar sinkron dengan API backend dan mudah diaudit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-7">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="client-code">Kode klien</FieldLabel>
              <Input data-testid="client-form-code" defaultValue={values?.client_code ?? ""} id="client-code" name="client_code" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-company">Nama perusahaan</FieldLabel>
              <Input data-testid="client-form-company" defaultValue={values?.company_name ?? ""} id="client-company" name="company_name" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-contact">Kontak utama</FieldLabel>
              <Input data-testid="client-form-contact" defaultValue={values?.contact_person ?? ""} id="client-contact" name="contact_person" />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-email">Email</FieldLabel>
              <Input data-testid="client-form-email" defaultValue={values?.email ?? ""} id="client-email" name="email" type="email" />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-phone">Telepon</FieldLabel>
              <Input data-testid="client-form-phone" defaultValue={values?.phone ?? ""} id="client-phone" name="phone" />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-address">Alamat</FieldLabel>
              <Input data-testid="client-form-address" defaultValue={values?.address ?? ""} id="client-address" name="address" />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-status">Status</FieldLabel>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-hidden transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                data-testid="client-form-status"
                defaultValue={values?.status ?? "active"}
                id="client-status"
                name="status"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldDescription>Status ini dipakai untuk memisahkan klien aktif dan arsip pada daftar utama.</FieldDescription>
            </Field>

            <Field>
              <label className="flex items-start gap-3 rounded-2xl border border-line bg-card-strong px-4 py-4 text-sm text-foreground">
                <input
                  className="mt-1 size-4 rounded border border-input"
                  data-testid="client-form-portal-access"
                  defaultChecked={values?.portal_access_enabled ?? false}
                  name="portal_access_enabled"
                  type="checkbox"
                  value="1"
                />
                <span className="flex flex-col gap-1">
                  <span className="font-medium">Aktifkan akses portal</span>
                  <span className="text-muted">Gunakan opsi ini bila klien perlu disiapkan untuk akses portal di modul berikutnya.</span>
                </span>
              </label>
            </Field>
          </FieldGroup>

          <div className="flex flex-wrap items-center gap-3">
            <Button data-testid="client-form-submit" size="lg" type="submit">
              {isCreate ? "Simpan klien" : "Simpan perubahan"}
            </Button>
            <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/app/clients">
              Batal
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
