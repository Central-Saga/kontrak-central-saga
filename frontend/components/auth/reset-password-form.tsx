"use client";

import Image from "next/image";
import { startTransition, useActionState, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ResetPasswordFormState = {
  message: string;
  success: boolean;
};

type ResetPasswordFormProps = React.ComponentProps<"div"> & {
  email: string;
  hasLogoAsset?: boolean;
  initialError?: { message: string; success: boolean } | null;
  logoPath?: string;
  token: string;
};

const DEFAULT_BRAND_LOGO_PATH = "/favicon_io/logo-256.png";

const initialResetPasswordFormState: ResetPasswordFormState = {
  message: "",
  success: false,
};

function resolveResetPasswordState(
  _previousState: ResetPasswordFormState,
  nextState: ResetPasswordFormState,
): ResetPasswordFormState {
  return nextState;
}

function ResetPasswordBrand({ hasLogoAsset, logoPath }: { hasLogoAsset: boolean; logoPath: string }) {
  if (!hasLogoAsset) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
        CS
      </div>
    );
  }

  return (
    <Image
      alt="PT Central Saga Mandala"
      className="h-16 w-16 rounded-xl object-contain"
      height={64}
      priority
      src={logoPath}
      width={64}
    />
  );
}

export function ResetPasswordForm({
  className,
  email: initialEmail,
  hasLogoAsset = false,
  initialError = null,
  logoPath = DEFAULT_BRAND_LOGO_PATH,
  token: initialToken,
  ...props
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submissionState, rememberSubmissionState] = useActionState(
    resolveResetPasswordState,
    initialError ?? initialResetPasswordFormState,
  );

  const isInvalid = !submissionState.success && Boolean(submissionState.message);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!initialEmail || !initialToken || !password || !passwordConfirmation) {
      const nextState = {
        message: "Email, token, password, dan konfirmasi password wajib diisi.",
        success: false,
      };

      startTransition(() => {
        rememberSubmissionState(nextState);
      });
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: initialEmail,
          token: initialToken,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            code?: string;
            message?: string;
          }
        | null;

      if (response.ok) {
        const message = payload?.message ?? "Password berhasil direset. Silakan login dengan password baru.";

        startTransition(() => {
          rememberSubmissionState({ message, success: true });
        });

        window.location.href = "/login?status=password-reset";
        return;
      }

      const nextState = {
        message: payload?.message ?? "Reset password gagal. Silakan coba lagi.",
        success: false,
      };

      startTransition(() => {
        rememberSubmissionState(nextState);
      });
      return;
    } catch {
      const nextState = {
        message: "Layanan sedang tidak tersedia. Silakan coba beberapa saat lagi.",
        success: false,
      };

      startTransition(() => {
        rememberSubmissionState(nextState);
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action="/auth/reset-password" className="flex flex-col gap-6" method="POST" onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex flex-col items-center gap-3">
              <ResetPasswordBrand hasLogoAsset={hasLogoAsset} logoPath={logoPath} />
              <span className="text-xs font-medium uppercase tracking-[0.28em] text-primary">
                PT Central Saga Mandala
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold">Reset password</h1>
              <FieldDescription className="max-w-xs text-center text-balance">
                Masukkan password baru Anda. Password minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.
              </FieldDescription>
            </div>
          </div>

          <input name="email" type="hidden" value={initialEmail} />
          <input name="token" type="hidden" value={initialToken} />

          <Field data-invalid={isInvalid || undefined}>
            <FieldLabel htmlFor="reset-password-input">Password baru</FieldLabel>
            <PasswordInput
              aria-describedby={isInvalid ? "reset-password-error" : undefined}
              aria-invalid={isInvalid}
              autoComplete="new-password"
              className="h-10"
              id="reset-password-input"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 8 karakter"
              required
              value={password}
            />
          </Field>

          <Field data-invalid={isInvalid || undefined}>
            <FieldLabel htmlFor="reset-password-confirmation-input">Konfirmasi password baru</FieldLabel>
            <PasswordInput
              aria-describedby={isInvalid ? "reset-password-error" : undefined}
              aria-invalid={isInvalid}
              autoComplete="new-password"
              className="h-10"
              id="reset-password-confirmation-input"
              name="password_confirmation"
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              placeholder="Ulangi password baru"
              required
              value={passwordConfirmation}
            />
          </Field>

          <Field>
            <Button className="w-full" disabled={isPending} size="lg" type="submit">
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" size="sm" />
                  Memproses...
                </>
              ) : (
                "Simpan password baru"
              )}
            </Button>
          </Field>

          <FieldSeparator />

          <Field>
            <div
              aria-live="polite"
              className={cn(
                "hidden",
                ((isInvalid && !isPending) || (submissionState.success && !isPending)) && "block",
              )}
              id="reset-password-message"
              role={isInvalid ? "alert" : undefined}
            >
              {submissionState.success ? (
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-emerald-600">
                  <span className="font-medium">{submissionState.message}</span>
                </div>
              ) : (
                <FieldError className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
                  <span className="font-medium">Reset password belum berhasil.</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{submissionState.message}</span>
                </FieldError>
              )}
            </div>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
