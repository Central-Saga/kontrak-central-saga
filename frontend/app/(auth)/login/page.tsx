import { access } from "node:fs/promises";
import { join } from "node:path";

import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const BRAND_LOGO_PATH = "/brand/logo.png";

function getInitialLoginError(errorCode?: string) {
  if (errorCode === "invalid_credentials") {
    return {
      code: errorCode,
      message: "Email atau password tidak valid.",
      success: false,
    };
  }

  if (errorCode === "network_error") {
    return {
      code: errorCode,
      message: "Layanan login sedang tidak tersedia. Silakan coba beberapa saat lagi.",
      success: false,
    };
  }

  if (errorCode === "invalid_input") {
    return {
      code: errorCode,
      message: "Email dan password wajib diisi.",
      success: false,
    };
  }

  return null;
}

async function hasBrandLogoAsset() {
  try {
    await access(join(process.cwd(), "public", "brand", "logo.png"));
    return true;
  } catch {
    return false;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, hasLogoAsset] = await Promise.all([searchParams, hasBrandLogoAsset()]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm
          hasLogoAsset={hasLogoAsset}
          initialError={getInitialLoginError(params.error)}
          logoPath={BRAND_LOGO_PATH}
        />
      </div>
    </main>
  );
}
