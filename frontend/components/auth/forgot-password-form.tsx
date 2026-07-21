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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ForgotPasswordFormState = {
  message: string;
  success: boolean;
};

type ForgotPasswordFormProps = React.ComponentProps<"div"> & {
  hasLogoAsset?: boolean;
  initialError?: { message: string; success: boolean } | null;
  initialSuccess?: { message: string; success: boolean } | null;
  logoPath?: string;
};

const DEFAULT_BRAND_LOGO_PATH = "/favicon_io/logo-256.png";

const initialForgotPasswordFormState: ForgotPasswordFormState = {
  message: "",
  success: false,
};

function resolveForgotPasswordState(
  _previousState: ForgotPasswordFormState,
  nextState: ForgotPasswordFormState,
): ForgotPasswordFormState {
  return nextState;
}

function ForgotPasswordBrand({ hasLogoAsset, logoPath }: { hasLogoAsset: boolean; logoPath: string }) {
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

export function ForgotPasswordForm({
  className,
  hasLogoAsset = false,
  initialError = null,
  initialSuccess = null,
  logoPath = DEFAULT_BRAND_LOGO_PATH,
  ...props
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submissionState, rememberSubmissionState] = useActionState(
    resolveForgotPasswordState,
    initialSuccess ?? initialForgotPasswordFormState,
  );

  const error = initialError && !submissionState.success ? initialError : submissionState;
  const isInvalid = !error.success && Boolean(error.message);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEmail = email.trim();

    if (!nextEmail) {
      const nextState = {
        message: "Email wajib diisi.",
        success: false,
      };

      startTransition(() => {
        rememberSubmissionState(nextState);
      });
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: nextEmail }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            code?: string;
            message?: string;
          }
        | null;

      if (!response.ok) {
        const nextState = {
          message: payload?.message ?? "Permintaan reset password gagal. Silakan coba lagi.",
          success: false,
        };

        startTransition(() => {
          rememberSubmissionState(nextState);
        });
        return;
      }

      const nextState = {
        message: payload?.message ?? "Jika email terdaftar, link reset password telah dikirim.",
        success: true,
      };

      startTransition(() => {
        rememberSubmissionState(nextState);
      });
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
      <form action="/auth/forgot-password" className="flex flex-col gap-6" method="POST" onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex flex-col items-center gap-3">
              <ForgotPasswordBrand hasLogoAsset={hasLogoAsset} logoPath={logoPath} />
              <span className="text-xs font-medium uppercase tracking-[0.28em] text-primary">
                PT Central Saga Mandala
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold">Lupa password</h1>
              <FieldDescription className="max-w-xs text-center text-balance">
                Masukkan email kerja Anda. Jika terdaftar, link reset password akan dikirim ke email tersebut.
              </FieldDescription>
            </div>
          </div>

          <Field data-invalid={isInvalid || undefined}>
            <FieldLabel htmlFor="forgot-password-email-input">Email kerja</FieldLabel>
            <Input
              aria-describedby={isInvalid ? "forgot-password-error" : undefined}
              aria-invalid={isInvalid}
              autoComplete="email"
              className="h-10"
              id="forgot-password-email-input"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@centralsaga.co.id"
              required
              type="email"
              value={email}
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
                "Kirim link reset password"
              )}
            </Button>
          </Field>

          <FieldSeparator />

          <Field>
            <div
              aria-live="polite"
              className={cn("hidden", isInvalid && !isPending && "block")}
              id="forgot-password-error"
              role={isInvalid ? "alert" : undefined}
            >
              <FieldError className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
                <span className="font-medium">Permintaan belum berhasil.</span>
                <span className="mt-1 block text-sm text-muted-foreground">{error.message}</span>
              </FieldError>
            </div>

            {submissionState.success ? (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <span className="font-medium text-emerald-700">Link telah dikirim.</span>
                <span className="mt-1 block text-sm text-muted-foreground">{submissionState.message}</span>
              </div>
            ) : null}
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center text-balance">
        <a className="text-primary underline-offset-4 hover:underline" href="/login">
          Kembali ke halaman login
        </a>
      </FieldDescription>
    </div>
  );
}
