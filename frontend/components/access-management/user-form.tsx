import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectionGroup } from "@/components/access-management/shared";

type UserFormProps = {
  action: (formData: FormData) => Promise<void>;
  mode: "create" | "edit";
  roles: Array<{
    id: number;
    name: string;
    guard_name: string;
  }>;
  values?: {
    email?: string;
    name?: string;
    roleIds?: number[];
  };
};

export function UserForm({ action, mode, roles, values }: UserFormProps) {
  const isCreate = mode === "create";

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>{isCreate ? "Tambah pengguna baru" : "Perbarui data pengguna"}</CardTitle>
        <CardDescription>
          Form ini tetap berjalan lewat server action agar token backend tidak pernah masuk ke JavaScript klien.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-7">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="user-name">Nama lengkap</FieldLabel>
              <Input data-testid="user-form-name" defaultValue={values?.name ?? ""} id="user-name" name="name" placeholder="Nama pengguna" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="user-email">Email</FieldLabel>
              <Input
                data-testid="user-form-email"
                defaultValue={values?.email ?? ""}
                id="user-email"
                name="email"
                placeholder="nama@centralsaga.test"
                required
                type="email"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="user-password">Password {isCreate ? "awal" : "baru (opsional)"}</FieldLabel>
              <Input
                data-testid="user-form-password"
                id="user-password"
                minLength={8}
                name="password"
                placeholder={isCreate ? "Minimal 8 karakter" : "Kosongkan bila tidak ingin mengubah password"}
                required={isCreate}
                type="password"
              />
              <FieldDescription>
                {isCreate
                  ? "Password minimum delapan karakter sesuai validasi backend."
                  : "Saat dikosongkan, password lama akan tetap dipakai."}
              </FieldDescription>
            </Field>

            <SelectionGroup
              description="Peran dikirim sebagai `role_ids[]` ke backend supaya tetap sinkron dengan API CRUD pengguna."
              emptyMessage="Belum ada peran yang bisa dipilih dari backend. Pengguna tetap bisa disimpan tanpa peran."
              inputName="role_ids"
              legend="Peran pengguna"
              options={roles.map((role) => ({
                id: role.id,
                name: role.name,
                meta: `Penjaga: ${role.guard_name}`,
              }))}
              selectedIds={values?.roleIds ?? []}
            />
          </FieldGroup>

          <div className="flex flex-wrap items-center gap-3">
            <Button data-testid="user-form-submit" size="lg" type="submit">
              {isCreate ? "Simpan pengguna" : "Simpan perubahan"}
            </Button>
            <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/app/users">
              Batal
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
