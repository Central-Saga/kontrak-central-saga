import {
  createPaymentAction,
  createPaymentTermAction,
  createProjectProgressAction,
  deletePaymentAction,
  deletePaymentTermAction,
  deleteProjectProgressAction,
  updatePaymentAction,
  updatePaymentTermAction,
  updateProjectProgressAction,
  uploadPaymentProofAction,
} from "@/app/(app)/app/access-management/actions";
import { DeleteConfirmationDialog } from "@/components/access-management/delete-confirmation-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContractRecord, PaymentRecord, PaymentTermRecord, ProjectProgressRecord } from "@/lib/access-management/backend";

const paymentTermStatusLabels: Record<string, string> = {
  pending: "Menunggu",
  upcoming: "Akan datang",
  paid: "Lunas",
  partially_paid: "Terbayar sebagian",
  overdue: "Jatuh tempo",
  cancelled: "Dibatalkan",
};

const paymentStatusLabels: Record<string, string> = {
  pending_review: "Menunggu verifikasi",
  verified: "Terverifikasi",
  rejected: "Ditolak",
};

const progressStatusLabels: Record<string, string> = {
  not_started: "Belum mulai",
  in_progress: "Berjalan",
  on_hold: "Tertahan",
  delayed: "Terlambat",
  completed: "Selesai",
};

function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

function statusPillClass(status: string, kind: "term" | "payment" | "progress") {
  if (kind === "term") {
    if (status === "paid") {
      return "border-primary/20 bg-primary/10 text-primary";
    }

    if (status === "partially_paid" || status === "upcoming") {
      return "border-highlight/20 bg-accent-soft text-secondary-foreground";
    }

    if (status === "overdue" || status === "cancelled") {
      return "border-destructive/20 bg-destructive/10 text-destructive";
    }
  }

  if (kind === "payment") {
    if (status === "verified") {
      return "border-primary/20 bg-primary/10 text-primary";
    }

    if (status === "pending_review") {
      return "border-highlight/20 bg-accent-soft text-secondary-foreground";
    }

    if (status === "rejected") {
      return "border-destructive/20 bg-destructive/10 text-destructive";
    }
  }

  if (kind === "progress") {
    if (status === "completed") {
      return "border-primary/20 bg-primary/10 text-primary";
    }

    if (status === "in_progress") {
      return "border-highlight/20 bg-accent-soft text-secondary-foreground";
    }

    if (status === "delayed" || status === "on_hold") {
      return "border-destructive/20 bg-destructive/10 text-destructive";
    }
  }

  return "border-line bg-card-strong text-muted";
}

function SectionPill({ label, status, kind }: { label: string; status: string; kind: "term" | "payment" | "progress" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusPillClass(status, kind)}`}>
      {label}
    </span>
  );
}

function PaymentProofUploadForm({ contractId, payment }: { contractId: number; payment: PaymentRecord }) {
  const uploadAction = uploadPaymentProofAction.bind(null, contractId, payment.id);

  return (
    <form action={uploadAction} className="flex flex-col gap-3 rounded-2xl border border-dashed border-line bg-background p-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`payment-proof-file-${payment.id}`}>Upload bukti pembayaran</FieldLabel>
          <Input id={`payment-proof-file-${payment.id}`} name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required />
          <FieldDescription>PDF atau gambar hingga 10 MB.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`payment-proof-notes-${payment.id}`}>Catatan bukti</FieldLabel>
          <Textarea id={`payment-proof-notes-${payment.id}`} name="notes" placeholder="Nomor referensi transfer, pengirim, atau catatan verifikasi." />
        </Field>
      </FieldGroup>
      <Button type="submit" variant="secondary">Unggah bukti</Button>
    </form>
  );
}

export type ContractOperationsPermissions = {
  canCreatePaymentTerms: boolean;
  canUpdatePaymentTerms: boolean;
  canDeletePaymentTerms: boolean;
  canCreatePayments: boolean;
  canUpdatePayments: boolean;
  canDeletePayments: boolean;
  canCreateProgress: boolean;
  canUpdateProgress: boolean;
  canDeleteProgress: boolean;
  canUploadPaymentProof: boolean;
};

export const readOnlyContractOperationsPermissions: ContractOperationsPermissions = {
  canCreatePaymentTerms: false,
  canUpdatePaymentTerms: false,
  canDeletePaymentTerms: false,
  canCreatePayments: false,
  canUpdatePayments: false,
  canDeletePayments: false,
  canCreateProgress: false,
  canUpdateProgress: false,
  canDeleteProgress: false,
  canUploadPaymentProof: false,
};

export const fullContractOperationsPermissions: ContractOperationsPermissions = {
  canCreatePaymentTerms: true,
  canUpdatePaymentTerms: true,
  canDeletePaymentTerms: true,
  canCreatePayments: true,
  canUpdatePayments: true,
  canDeletePayments: true,
  canCreateProgress: true,
  canUpdateProgress: true,
  canDeleteProgress: true,
  canUploadPaymentProof: true,
};

function PaymentEditForm({ contractId, payment, paymentTerms }: { contractId: number; payment: PaymentRecord; paymentTerms: PaymentTermRecord[] }) {
  const updateAction = updatePaymentAction.bind(null, contractId, payment.id);

  return (
    <details className="rounded-2xl border border-line bg-card-strong p-4">
      <summary className="cursor-pointer text-sm font-medium text-foreground">Ubah data pembayaran</summary>
      <form action={updateAction} className="mt-4 flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`payment-term-select-${payment.id}`}>Pilih termin</FieldLabel>
            <select id={`payment-term-select-${payment.id}`} name="payment_term_id" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" defaultValue={String(payment.payment_term_id)} required>
              {paymentTerms.map((term) => (
                <option key={term.id} value={term.id}>{`Termin ${term.term_number} • ${term.term_title}`}</option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`payment-date-${payment.id}`}>Tanggal bayar</FieldLabel>
            <Input id={`payment-date-${payment.id}`} name="payment_date" type="date" defaultValue={payment.payment_date} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`payment-amount-${payment.id}`}>Nominal bayar</FieldLabel>
            <Input id={`payment-amount-${payment.id}`} name="amount" type="number" min="0" step="0.01" defaultValue={String(payment.amount)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`payment-method-${payment.id}`}>Metode pembayaran</FieldLabel>
            <Input id={`payment-method-${payment.id}`} name="method" defaultValue={payment.method} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`payment-status-${payment.id}`}>Status pembayaran</FieldLabel>
            <select id={`payment-status-${payment.id}`} name="status" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" defaultValue={payment.status}>
              <option value="pending_review">Menunggu verifikasi</option>
              <option value="verified">Terverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </Field>
        </FieldGroup>
        <Button type="submit" variant="outline">Simpan perubahan pembayaran</Button>
      </form>
    </details>
  );
}

function PaymentTermEditForm({ contractId, term }: { contractId: number; term: PaymentTermRecord }) {
  const updateAction = updatePaymentTermAction.bind(null, contractId, term.id);

  return (
    <details className="rounded-2xl border border-line bg-background p-4">
      <summary className="cursor-pointer text-sm font-medium text-foreground">Ubah termin pembayaran</summary>
      <form action={updateAction} className="mt-4 flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`payment-term-number-${term.id}`}>Nomor termin</FieldLabel>
            <Input id={`payment-term-number-${term.id}`} name="term_number" type="number" min="1" defaultValue={term.term_number} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`payment-term-title-${term.id}`}>Judul termin</FieldLabel>
            <Input id={`payment-term-title-${term.id}`} name="term_title" defaultValue={term.term_title} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`payment-term-due-date-${term.id}`}>Tanggal jatuh tempo</FieldLabel>
            <Input id={`payment-term-due-date-${term.id}`} name="due_date" type="date" defaultValue={term.due_date} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`payment-term-amount-${term.id}`}>Nilai termin</FieldLabel>
            <Input id={`payment-term-amount-${term.id}`} name="amount" type="number" min="0" step="0.01" defaultValue={String(term.amount)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`payment-term-status-${term.id}`}>Status termin</FieldLabel>
            <select id={`payment-term-status-${term.id}`} name="status" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" defaultValue={term.status}>
              <option value="pending">Menunggu</option>
              <option value="upcoming">Akan datang</option>
              <option value="overdue">Jatuh tempo</option>
              <option value="paid">Lunas</option>
              <option value="partially_paid">Terbayar sebagian</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`payment-term-condition-${term.id}`}>Syarat bayar</FieldLabel>
            <Input id={`payment-term-condition-${term.id}`} name="payable_after_condition" defaultValue={term.payable_after_condition ?? ""} />
          </Field>
          <Field>
            <FieldLabel htmlFor={`payment-term-description-${term.id}`}>Keterangan</FieldLabel>
            <Textarea id={`payment-term-description-${term.id}`} name="description" defaultValue={term.description ?? ""} />
          </Field>
        </FieldGroup>
        <Button type="submit" variant="outline">Simpan perubahan termin</Button>
      </form>
    </details>
  );
}

function ProjectProgressEditForm({ contractId, progress }: { contractId: number; progress: ProjectProgressRecord }) {
  const updateAction = updateProjectProgressAction.bind(null, contractId, progress.id);

  return (
    <details className="rounded-2xl border border-line bg-background p-4">
      <summary className="cursor-pointer text-sm font-medium text-foreground">Ubah progres proyek</summary>
      <form action={updateAction} className="mt-4 flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`project-progress-date-${progress.id}`}>Tanggal laporan</FieldLabel>
            <Input id={`project-progress-date-${progress.id}`} name="progress_date" type="date" defaultValue={progress.progress_date} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`project-progress-title-${progress.id}`}>Judul progres</FieldLabel>
            <Input id={`project-progress-title-${progress.id}`} name="progress_title" defaultValue={progress.progress_title} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`project-progress-percentage-${progress.id}`}>Persentase progres</FieldLabel>
            <Input id={`project-progress-percentage-${progress.id}`} name="percentage" type="number" min="0" max="100" defaultValue={progress.percentage} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`project-progress-status-${progress.id}`}>Status progres</FieldLabel>
            <select id={`project-progress-status-${progress.id}`} name="status" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" defaultValue={progress.status}>
              <option value="not_started">Belum mulai</option>
              <option value="in_progress">Berjalan</option>
              <option value="on_hold">Tertahan</option>
              <option value="delayed">Terlambat</option>
              <option value="completed">Selesai</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`project-progress-milestone-${progress.id}`}>Referensi milestone</FieldLabel>
            <Input id={`project-progress-milestone-${progress.id}`} name="milestone_reference" defaultValue={progress.milestone_reference ?? ""} />
          </Field>
          <Field>
            <FieldLabel htmlFor={`project-progress-description-${progress.id}`}>Deskripsi progres</FieldLabel>
            <Textarea id={`project-progress-description-${progress.id}`} name="progress_description" defaultValue={progress.progress_description} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`project-progress-notes-${progress.id}`}>Catatan tambahan</FieldLabel>
            <Textarea id={`project-progress-notes-${progress.id}`} name="notes" defaultValue={progress.notes ?? ""} />
          </Field>
        </FieldGroup>
        <Button type="submit" variant="outline">Simpan perubahan progres</Button>
      </form>
    </details>
  );
}

function PaymentTermCard({ contractId, term, paymentTerms, permissions }: { contractId: number; term: PaymentTermRecord; paymentTerms: PaymentTermRecord[]; permissions: ContractOperationsPermissions }) {
  const deleteAction = deletePaymentTermAction.bind(null, contractId, term.id);
  const payments = term.payments ?? [];

  return (
    <div className="rounded-2xl border border-line bg-card-strong p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line bg-background px-3 py-1 text-xs font-mono">Termin {term.term_number}</span>
            <SectionPill label={paymentTermStatusLabels[term.status] ?? term.status} status={term.status} kind="term" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{term.term_title}</p>
            <p className="text-sm text-muted">Jatuh tempo {formatDate(term.due_date)} • {formatCurrency(term.amount)}</p>
          </div>
          {term.description ? <p className="text-sm leading-7 text-muted">{term.description}</p> : null}
          {term.payable_after_condition ? <p className="text-xs text-muted">Syarat bayar: {term.payable_after_condition}</p> : null}
        </div>

        {permissions.canDeletePaymentTerms ? (
          <DeleteConfirmationDialog
            action={deleteAction}
            description="Termin pembayaran ini akan dihapus permanen dari kontrak."
            title="Hapus termin pembayaran?"
            triggerButtonProps={{ size: "sm", variant: "destructive" }}
            triggerLabel="Hapus"
            tooltipLabel="Hapus termin"
          />
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {permissions.canUpdatePaymentTerms ? <PaymentTermEditForm contractId={contractId} term={term} /> : null}

        {payments.length ? payments.map((payment) => (
          <div key={payment.id} className="rounded-2xl border border-line bg-background p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SectionPill label={paymentStatusLabels[payment.status] ?? payment.status} status={payment.status} kind="payment" />
                  <span className="text-xs text-muted">{formatDate(payment.payment_date)}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{formatCurrency(payment.amount)} • {payment.method}</p>
                {payment.proof_files?.length ? (
                  <div className="flex flex-col gap-2">
                    {payment.proof_files.map((proof) => (
                      <a key={proof.id} className="text-sm text-primary underline-offset-4 hover:underline" href={proof.url} rel="noreferrer" target="_blank">
                        {proof.file_name}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Belum ada bukti pembayaran yang diunggah.</p>
                )}
              </div>
              <div className="flex w-full max-w-sm flex-col gap-3">
                {permissions.canDeletePayments ? (
                  <DeleteConfirmationDialog
                    action={deletePaymentAction.bind(null, contractId, payment.id)}
                    description="Data pembayaran ini akan dihapus permanen."
                    title="Hapus pembayaran?"
                    triggerButtonProps={{ size: "sm", variant: "destructive" }}
                    triggerLabel="Hapus"
                    tooltipLabel="Hapus pembayaran"
                  />
                ) : null}
                {permissions.canUpdatePayments ? <PaymentEditForm contractId={contractId} payment={payment} paymentTerms={paymentTerms} /> : null}
                {permissions.canUploadPaymentProof ? <PaymentProofUploadForm contractId={contractId} payment={payment} /> : null}
              </div>
            </div>
          </div>
        )) : <p className="text-sm text-muted">Belum ada pembayaran yang tercatat untuk termin ini.</p>}
      </div>
    </div>
  );
}

function ProgressCard({ contractId, progress, permissions }: { contractId: number; progress: ProjectProgressRecord; permissions: ContractOperationsPermissions }) {
  return (
    <div className="rounded-2xl border border-line bg-card-strong p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <SectionPill label={progressStatusLabels[progress.status] ?? progress.status} status={progress.status} kind="progress" />
            <span className="text-xs text-muted">{formatDate(progress.progress_date)}</span>
          </div>
          <p className="text-base font-semibold text-foreground">{progress.progress_title}</p>
          <p className="text-sm text-muted">Progress {progress.percentage}%</p>
          <p className="text-sm leading-7 text-muted">{progress.progress_description}</p>
          {progress.milestone_reference ? <p className="text-xs text-muted">Milestone: {progress.milestone_reference}</p> : null}
          {progress.notes ? <p className="text-xs text-muted">Catatan: {progress.notes}</p> : null}
        </div>
        {permissions.canDeleteProgress ? (
          <DeleteConfirmationDialog
            action={deleteProjectProgressAction.bind(null, contractId, progress.id)}
            description="Catatan progres ini akan dihapus permanen."
            title="Hapus progres proyek?"
            triggerButtonProps={{ size: "sm", variant: "destructive" }}
            triggerLabel="Hapus"
            tooltipLabel="Hapus progres"
          />
        ) : null}
      </div>
      {permissions.canUpdateProgress ? (
        <div className="mt-4">
          <ProjectProgressEditForm contractId={contractId} progress={progress} />
        </div>
      ) : null}
    </div>
  );
}

export function ContractOperationsSections({ contract, permissions }: { contract: ContractRecord; permissions: ContractOperationsPermissions }) {
  const contractId = contract.id;
  const paymentTerms = contract.payment_terms ?? [];
  const progressUpdates = contract.project_progress ?? [];
  const createPaymentTerm = createPaymentTermAction.bind(null, contractId);
  const createPayment = createPaymentAction.bind(null, contractId);
  const createProgress = createProjectProgressAction.bind(null, contractId);
  const showCreateColumn =
    permissions.canCreatePaymentTerms || permissions.canCreatePayments || permissions.canCreateProgress;

  return (
    <div className={showCreateColumn ? "grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]" : "flex flex-col gap-6"}>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Data termin pembayaran</CardTitle>
            <CardDescription>Jadwal pembayaran bertahap sesuai kontrak, lengkap dengan status dan realisasi pembayaran per termin.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {paymentTerms.length ? paymentTerms.map((term) => <PaymentTermCard key={term.id} contractId={contractId} term={term} paymentTerms={paymentTerms} permissions={permissions} />) : (
              <Alert>
                <AlertTitle>Belum ada termin pembayaran</AlertTitle>
                <AlertDescription>Tambahkan termin pertama agar jadwal penagihan kontrak bisa dipantau oleh tim dan klien.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Data progres proyek</CardTitle>
            <CardDescription>Catatan perkembangan proyek berdasarkan tanggal laporan, persentase capaian, dan milestone terkait.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {progressUpdates.length ? progressUpdates.map((progress) => <ProgressCard key={progress.id} contractId={contractId} progress={progress} permissions={permissions} />) : (
              <Alert>
                <AlertTitle>Belum ada progres proyek</AlertTitle>
                <AlertDescription>Tambahkan laporan progres agar kondisi eksekusi proyek terbaca langsung dari halaman kontrak.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {showCreateColumn ? (
        <div className="flex flex-col gap-6">
          {permissions.canCreatePaymentTerms ? (
            <Card>
              <CardHeader>
                <CardTitle>Tambah termin pembayaran</CardTitle>
                <CardDescription>Gunakan form ini untuk menambahkan termin baru ke kontrak aktif.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createPaymentTerm} className="flex flex-col gap-6">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="create-payment-term-number">Nomor termin</FieldLabel>
                      <Input id="create-payment-term-number" name="term_number" type="number" min="1" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-payment-term-title">Judul termin</FieldLabel>
                      <Input id="create-payment-term-title" name="term_title" placeholder="DP proyek, Termin 1, Final payment" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-payment-term-due-date">Tanggal jatuh tempo</FieldLabel>
                      <Input id="create-payment-term-due-date" name="due_date" type="date" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-payment-term-amount">Nilai termin</FieldLabel>
                      <Input id="create-payment-term-amount" name="amount" type="number" min="0" step="0.01" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-payment-term-status">Status termin</FieldLabel>
                      <select id="create-payment-term-status" name="status" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" defaultValue="pending">
                        <option value="pending">Menunggu</option>
                        <option value="upcoming">Akan datang</option>
                        <option value="overdue">Jatuh tempo</option>
                        <option value="paid">Lunas</option>
                        <option value="partially_paid">Terbayar sebagian</option>
                        <option value="cancelled">Dibatalkan</option>
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-payment-term-condition">Syarat bayar</FieldLabel>
                      <Input id="create-payment-term-condition" name="payable_after_condition" placeholder="Setelah BAST / setelah invoice terbit" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-payment-term-description">Keterangan</FieldLabel>
                      <Textarea id="create-payment-term-description" name="description" placeholder="Rincian termin pembayaran" />
                    </Field>
                  </FieldGroup>
                  <Button type="submit">Simpan termin</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {permissions.canCreatePayments ? (
            <Card>
              <CardHeader>
                <CardTitle>Tambah pembayaran</CardTitle>
                <CardDescription>Catat realisasi pembayaran klien untuk salah satu termin yang sudah dibuat.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createPayment} className="flex flex-col gap-6">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="create-payment-term-select">Pilih termin</FieldLabel>
                      <select id="create-payment-term-select" name="payment_term_id" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" required>
                        <option value="">Pilih termin pembayaran</option>
                        {paymentTerms.map((term) => (
                          <option key={term.id} value={term.id}>{`Termin ${term.term_number} • ${term.term_title}`}</option>
                        ))}
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-payment-date">Tanggal bayar</FieldLabel>
                      <Input id="create-payment-date" name="payment_date" type="date" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-payment-amount">Nominal bayar</FieldLabel>
                      <Input id="create-payment-amount" name="amount" type="number" min="0" step="0.01" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-payment-method">Metode pembayaran</FieldLabel>
                      <Input id="create-payment-method" name="method" placeholder="Transfer bank, giro, tunai" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-payment-status">Status pembayaran</FieldLabel>
                      <select id="create-payment-status" name="status" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" defaultValue="pending_review">
                        <option value="pending_review">Menunggu verifikasi</option>
                        <option value="verified">Terverifikasi</option>
                        <option value="rejected">Ditolak</option>
                      </select>
                    </Field>
                  </FieldGroup>
                  <Button type="submit" disabled={!paymentTerms.length}>Simpan pembayaran</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {permissions.canCreateProgress ? (
            <Card>
              <CardHeader>
                <CardTitle>Tambah progres proyek</CardTitle>
                <CardDescription>Masukkan perkembangan pekerjaan proyek sesuai tahapan yang sedang berjalan.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createProgress} className="flex flex-col gap-6">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="create-project-progress-date">Tanggal laporan</FieldLabel>
                      <Input id="create-project-progress-date" name="progress_date" type="date" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-project-progress-title">Judul progres</FieldLabel>
                      <Input id="create-project-progress-title" name="progress_title" placeholder="Pondasi selesai, instalasi dimulai" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-project-progress-percentage">Persentase progres</FieldLabel>
                      <Input id="create-project-progress-percentage" name="percentage" type="number" min="0" max="100" required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-project-progress-status">Status progres</FieldLabel>
                      <select id="create-project-progress-status" name="status" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" defaultValue="in_progress">
                        <option value="not_started">Belum mulai</option>
                        <option value="in_progress">Berjalan</option>
                        <option value="on_hold">Tertahan</option>
                        <option value="delayed">Terlambat</option>
                        <option value="completed">Selesai</option>
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-project-progress-milestone">Referensi milestone</FieldLabel>
                      <Input id="create-project-progress-milestone" name="milestone_reference" placeholder="Tahap struktur / finishing / serah terima" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-project-progress-description">Deskripsi progres</FieldLabel>
                      <Textarea id="create-project-progress-description" name="progress_description" placeholder="Jelaskan pekerjaan yang sudah selesai dan isu pentingnya." required />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="create-project-progress-notes">Catatan tambahan</FieldLabel>
                      <Textarea id="create-project-progress-notes" name="notes" placeholder="Hambatan, tindak lanjut, atau catatan lapangan" />
                    </Field>
                  </FieldGroup>
                  <Button type="submit">Simpan progres</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
