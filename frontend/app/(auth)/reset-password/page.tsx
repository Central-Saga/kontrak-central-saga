import { access } from "node:fs/promises";
import { join } from "node:path";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    email?: string;
    token?: string;
  }>;
};

const BRAND_LOGO_PATH = "/favicon_io/logo-256.png";

const errorMessages: Record<string, string> = {
  invalid_input: "Email, token, password, dan konfirmasi password wajib diisi.",
  password_invalid: "Password minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.",
  network_error: "Layanan sedang tidak tersedia. Silakan coba beberapa saat lagi.",
};

async function hasBrandLogoAsset() {
  try {
    await access(join(process.cwd(), "public", "favicon_io", "logo-256.png"));
    return true;
  } catch {
    return false;
  }
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const [params, hasLogoAsset] = await Promise.all([searchParams, hasBrandLogoAsset()]);
  const initialError = params.error ? { message: errorMessages[params.error] ?? "Reset password tidak berhasil.", success: false } : null;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ResetPasswordForm
          email={params.email ?? ""}
          hasLogoAsset={hasLogoAsset}
          initialError={initialError}
          logoPath={BRAND_LOGO_PATH}
          token={params.token ?? ""}
        />
      </div>
    </main>
  );
}
