import Link from "next/link";

import { DeleteConfirmationDialog } from "@/components/access-management/delete-confirmation-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { buildPermissionModuleGroups } from "@/lib/access-management/permissions";
import { RolePermissionsPanel } from "@/components/access-management/role-permissions-panel";

type RoleFormProps = {
  action: (formData: FormData) => Promise<void>;
  deleteAction?: () => Promise<void>;
  mode: "create" | "edit";
  permissions: Array<{
    id: number;
    name: string;
    guard_name: string;
  }>;
  values?: {
    name?: string;
    permissionIds?: number[];
  };
};

export function RoleForm({ action, deleteAction, mode, permissions, values }: RoleFormProps) {
  const isCreate = mode === "create";
  const permissionGroups = buildPermissionModuleGroups(permissions);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader className="gap-3">
          <CardTitle>{isCreate ? "Buat peran baru" : "Perbarui detail peran"}</CardTitle>
          <CardDescription>
            Nama peran tetap menjadi identitas utama, sedangkan sinkronisasi izin akses dikirim bersama submit yang sama ke backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="role-name">Nama peran</FieldLabel>
              <Input
                data-testid="role-form-name"
                defaultValue={values?.name ?? ""}
                id="role-name"
                name="name"
                placeholder="mis. qa-operasional"
                required
              />
              <FieldDescription>
                Gunakan nama yang ringkas dan mudah dikenali tim, misalnya berdasarkan fungsi atau area operasional.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <Alert>
            <AlertTitle>{isCreate ? "Mulai dari struktur paling penting" : "Perubahan akan langsung menyinkronkan akses"}</AlertTitle>
            <AlertDescription>
              {isCreate
                ? "Peran tetap valid walau belum memilih izin akses. Anda bisa mulai dari nama peran, lalu pilih izin yang memang dibutuhkan."
                : "Saat disimpan, backend akan memperbarui nama peran dan daftar izin akses yang terpilih dalam satu proses yang sama."}
            </AlertDescription>
          </Alert>

          <div className="rounded-3xl border border-line bg-card-strong p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-highlight">Izin tersedia</span>
                <span className="text-2xl font-semibold text-foreground">{permissions.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-highlight">Kelompok modul</span>
                <span className="text-2xl font-semibold text-foreground">{permissionGroups.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-3 border-t border-line/80 pt-6">
          <Button data-testid="role-form-submit" size="lg" type="submit">
            {isCreate ? "Simpan peran" : "Simpan perubahan"}
          </Button>
          <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/app/roles">
            Batal
          </Link>
          {!isCreate && deleteAction ? (
            <DeleteConfirmationDialog
              action={deleteAction}
              description="Peran ini akan dihapus permanen dari access management. Pastikan tidak ada tim yang masih bergantung pada peran ini sebelum melanjutkan."
              title="Hapus peran ini?"
              triggerButtonProps={{ "aria-label": "Hapus peran", size: "lg", variant: "destructive" }}
              triggerLabel="Hapus peran"
            />
          ) : null}
        </CardFooter>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="gap-3">
          <CardTitle>Penugasan izin akses</CardTitle>
          <CardDescription>
            Izin akses dikelompokkan per modul supaya pemilihan akses lebih cepat dibaca dan lebih aman saat diperbarui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <div className="flex flex-col gap-2">
              <FieldLegend>Izin akses peran</FieldLegend>
              <FieldDescription>
                Panel ini memakai accordion per modul agar daftar izin akses lebih ringkas dibaca. Gunakan kontrol pilih semua atau kosongkan untuk mempercepat pengaturan peran.
              </FieldDescription>
            </div>

            <RolePermissionsPanel
              modules={permissionGroups}
              selectedPermissionIds={values?.permissionIds ?? []}
            />
          </FieldSet>
        </CardContent>
      </Card>
    </form>
  );
}
