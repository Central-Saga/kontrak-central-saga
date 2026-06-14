"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

type ChangePasswordFormProps = {
  action: (formData: FormData) => Promise<void>;
};

export function ChangePasswordForm({ action }: ChangePasswordFormProps) {
  return (
    <form action={action} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="settings-current-password">Password saat ini</FieldLabel>
          <PasswordInput
            autoComplete="current-password"
            data-testid="settings-current-password-input"
            id="settings-current-password"
            name="current_password"
            required
          />
          <FieldDescription>
            Masukkan password aktif untuk memastikan perubahan dilakukan oleh pemilik akun yang sah.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="settings-password">Password baru</FieldLabel>
          <PasswordInput
            autoComplete="new-password"
            data-testid="settings-password-input"
            id="settings-password"
            minLength={8}
            name="password"
            required
          />
          <FieldDescription>
            Gunakan kombinasi minimal delapan karakter dengan huruf besar, huruf kecil, angka, atau simbol agar lebih kuat.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="settings-password-confirmation">Konfirmasi password baru</FieldLabel>
          <PasswordInput
            autoComplete="new-password"
            data-testid="settings-password-confirmation-input"
            id="settings-password-confirmation"
            minLength={8}
            name="password_confirmation"
            required
          />
          <FieldDescription>
            Ulangi password baru yang sama agar perubahan tidak tersimpan dengan salah ketik.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-3">
        <Button data-testid="settings-password-submit" size="lg" type="submit">
          Ganti password
        </Button>
      </div>
    </form>
  );
}