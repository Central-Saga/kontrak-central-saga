import Link from "next/link"

import { createProjectProgressStandaloneAction } from "@/app/(app)/app/access-management/actions"
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

const progressStatusOptions = [
  ["not_started", "Belum mulai"],
  ["in_progress", "Berjalan"],
  ["on_hold", "Tertahan"],
  ["delayed", "Terlambat"],
  ["completed", "Selesai"],
] as const

export default async function NewProjectProgressPage({ searchParams }: { searchParams: PageSearchParams }) {
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
        description="Catat progres proyek dengan kontrak sebagai induk agar riwayat pekerjaan tetap konsisten."
        eyebrow="Manajemen progres"
        title="Tambah progres proyek"
      />

      <StatusToastBridge error={error ?? undefined} />
      <StatusBanner error={message ?? undefined} />

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Data progres baru</CardTitle>
          <CardDescription>
            Update progres menyimpan tanggal laporan, persentase, status pekerjaan, dan catatan milestone per kontrak.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProjectProgressStandaloneAction} className="flex flex-col gap-7">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="project-progress-contract">Kontrak</FieldLabel>
                <select
                  className={selectClassName}
                  disabled={!contracts.length}
                  id="project-progress-contract"
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
                <FieldDescription>Progres proyek selalu dicatat terhadap satu kontrak.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="project-progress-date">Tanggal laporan</FieldLabel>
                <Input id="project-progress-date" name="progress_date" required type="date" />
              </Field>

              <Field>
                <FieldLabel htmlFor="project-progress-title">Judul progres</FieldLabel>
                <Input id="project-progress-title" name="progress_title" placeholder="Pondasi selesai, instalasi dimulai" required />
              </Field>

              <Field>
                <FieldLabel htmlFor="project-progress-percentage">Persentase progres</FieldLabel>
                <Input id="project-progress-percentage" max="100" min="0" name="percentage" required type="number" />
              </Field>

              <Field>
                <FieldLabel htmlFor="project-progress-status">Status progres</FieldLabel>
                <select className={selectClassName} defaultValue="in_progress" id="project-progress-status" name="status">
                  {progressStatusOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="project-progress-milestone">Referensi milestone</FieldLabel>
                <Input id="project-progress-milestone" name="milestone_reference" placeholder="Tahap struktur / finishing / serah terima" />
              </Field>

              <Field>
                <FieldLabel htmlFor="project-progress-description">Deskripsi progres</FieldLabel>
                <Textarea
                  id="project-progress-description"
                  name="progress_description"
                  placeholder="Jelaskan pekerjaan yang sudah selesai dan isu pentingnya."
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="project-progress-notes">Catatan tambahan</FieldLabel>
                <Textarea id="project-progress-notes" name="notes" placeholder="Hambatan, tindak lanjut, atau catatan lapangan" />
              </Field>
            </FieldGroup>

            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!contracts.length} size="lg" type="submit">
                Simpan progres
              </Button>
              <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/app/project-progress">
                Batal
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageStack>
  )
}
