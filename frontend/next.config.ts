import type { NextConfig } from "next";

function getAllowedDevOrigins() {
  const configuredOrigins = [
    process.env.FRONTEND_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    "https://app.kontrak-centralsaga.site",
    "https://app.127.0.0.1.nip.io",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://localhost:8443",
    "https://127.0.0.1:8443",
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
      allowedOrigins: [
        "app.kontrak-centralsaga.site",
        "app.127.0.0.1.nip.io",
        "localhost:3000",
        "127.0.0.1:3000",
        "localhost:8080",
        "127.0.0.1:8080",
        "localhost:8443",
        "127.0.0.1:8443",
      ],
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
