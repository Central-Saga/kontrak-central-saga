import type { NextConfig } from "next";

function getAllowedDevOrigins() {
  const configuredOrigins = [
    process.env.FRONTEND_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    "https://app.kontrak-centralsaga.site",
    "https://app.127.0.0.1.nip.io",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  return Array.from(
    new Set(
      configuredOrigins.flatMap((origin) => {
        if (!origin) {
          return [];
        }

        try {
          return [new URL(origin).hostname];
        } catch {
          return [origin];
        }
      })
    )
  );
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
