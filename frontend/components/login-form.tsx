"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { APP_HOME_PATH } from "@/lib/auth/navigation";
import { cn } from "@/lib/utils";
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

type LoginFormState = {
  code?: string;
  message: string;
  success: boolean;
};

type LoginFormProps = React.ComponentProps<"div"> & {
  initialError?: LoginFormState | null;
  hasLogoAsset?: boolean;
  logoPath?: string;
};

const DEFAULT_BRAND_LOGO_PATH = "/brand/logo.png";

const initialLoginFormState: LoginFormState = {
  message: "",
  success: false,
};

function resolveLoginState(_previousState: LoginFormState, nextState: LoginFormState): LoginFormState {
  return nextState;
}

function LoginBrand({ hasLogoAsset, logoPath }: { hasLogoAsset: boolean; logoPath: string }) {
  if (hasLogoAsset) {
    return (
      <div className="flex size-16 items-center justify-center rounded-2xl border border-line/60 bg-transparent shadow-xs">
        <Image
          alt="Logo PT Central Saga Mandala"
          className="h-auto w-auto max-h-10 max-w-10 object-contain"
          height={44}
          priority
          src={logoPath}
          width={44}
        />
      </div>
    );
  }

  return (
    <div className="flex size-16 items-center justify-center rounded-2xl border border-line/60 bg-transparent text-secondary-foreground shadow-xs">
      <span className="text-sm font-semibold tracking-[0.28em]">CS</span>
    </div>
  );
}

export function LoginForm({
  className,
  hasLogoAsset = false,
  initialError = null,
  logoPath = DEFAULT_BRAND_LOGO_PATH,
  ...props
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submissionState, rememberSubmissionState] = useActionState(resolveLoginState, initialLoginFormState);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<LoginFormState>(initialError ?? initialLoginFormState);

  const isInvalid = !error.success && Boolean(error.message);
  const errorTitle =
    error.code === "invalid_credentials"
      ? "Email atau password tidak cocok."
      : "Login belum berhasil.";

  useEffect(() => {
    if (!submissionState.success) {
      return;
    }

    router.replace(APP_HOME_PATH);
    router.refresh();
  }, [router, submissionState.success]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextEmail = String(formData.get("email") ?? "").trim();
    const nextPassword = String(formData.get("password") ?? "");

    if (!nextEmail || !nextPassword) {
      const nextState = {
        code: "invalid_input",
        message: "Email dan password wajib diisi.",
        success: false,
      };

      setError(nextState);
      startTransition(() => {
        rememberSubmissionState(nextState);
      });
      return;
    }

    setIsPending(true);
    setError(initialLoginFormState);

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: nextEmail,
          password: nextPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            code?: string;
            message?: string;
          }
        | null;

      if (!response.ok) {
        const nextState = {
          code: payload?.code,
          message: payload?.message ?? "Autentikasi gagal. Silakan coba lagi.",
          success: false,
        };

        setError(nextState);
        startTransition(() => {
          rememberSubmissionState(nextState);
        });
        return;
      }

      const nextState = {
        message: APP_HOME_PATH,
        success: true,
      };

      startTransition(() => {
        rememberSubmissionState(nextState);
      });
    } catch {
      const nextState = {
        code: "network_error",
        message: "Layanan login sedang tidak tersedia. Silakan coba beberapa saat lagi.",
        success: false,
      };

      setError(nextState);
      startTransition(() => {
        rememberSubmissionState(nextState);
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action="/auth/login" className="flex flex-col gap-6" method="POST" onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex flex-col items-center gap-3">
              <LoginBrand hasLogoAsset={hasLogoAsset} logoPath={logoPath} />
              <span className="text-xs font-medium uppercase tracking-[0.28em] text-primary">
                PT Central Saga Mandala
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold">Masuk ke Kontrak Central Saga</h1>
              <FieldDescription className="max-w-xs text-center text-balance">
                Portal internal untuk kontrak, termin pembayaran, dan progres proyek perusahaan.
              </FieldDescription>
            </div>
          </div>

          <Field data-invalid={isInvalid || undefined}>
            <FieldLabel htmlFor="login-email-input">Email kerja</FieldLabel>
            <Input
              aria-describedby={isInvalid ? "auth-error" : undefined}
              aria-invalid={isInvalid}
              autoComplete="email"
              className="h-10"
              data-testid="login-email-input"
              id="login-email-input"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@centralsaga.co.id"
              required
              type="email"
              value={email}
            />
          </Field>

          <Field data-invalid={isInvalid || undefined}>
            <FieldLabel htmlFor="login-password-input">Password</FieldLabel>
            <Input
              aria-describedby={isInvalid ? "auth-error" : undefined}
              aria-invalid={isInvalid}
              autoComplete="current-password"
              className="h-10"
              data-testid="login-password-input"
              id="login-password-input"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password Anda"
              required
              type="password"
              value={password}
            />
          </Field>

          <Field>
            <Button className="w-full" data-testid="login-submit" disabled={isPending} size="lg" type="submit">
              {isPending ? (
                <>
                  <Spinner data-icon="inline-start" size="sm" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </Field>

          <FieldSeparator>Akses internal</FieldSeparator>

          <Field>
            <div
              aria-live="polite"
              className={cn("hidden", isInvalid && !isPending && "block")}
              data-testid="auth-error"
              id="auth-error"
              role={isInvalid ? "alert" : undefined}
            >
              <FieldError className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
                <span className="font-medium">{errorTitle}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{error.message}</span>
              </FieldError>
            </div>

          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center text-balance">
        Hanya untuk pengguna internal yang berwenang. Setelah login berhasil, aplikasi akan
        mengarahkan Anda ke workspace terproteksi di <code>/app</code>.
      </FieldDescription>
    </div>
  );
}
