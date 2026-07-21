import { access } from "node:fs/promises";
import { join } from "node:path";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

const BRAND_LOGO_PATH = "/favicon_io/logo-256.png";

const errorMessages: Record<string, string> = {
  invalid_input: "Email wajib diisi.",
  invalid_email: "Format email tidak valid.",
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

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const [params, hasLogoAsset] = await Promise.all([searchParams, hasBrandLogoAsset()]);
  const initialError = params.error ? { message: errorMessages[params.error] ?? "Permintaan tidak berhasil.", success: false } : null;
  const initialSuccess = params.status === "email-sent" ? { message: "Jika email terdaftar, link reset password telah dikirim.", success: true } : null;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm
          hasLogoAsset={hasLogoAsset}
          initialError={initialError}
          initialSuccess={initialSuccess}
          logoPath={BRAND_LOGO_PATH}
        />
      </div>
    </main>
  );
}
