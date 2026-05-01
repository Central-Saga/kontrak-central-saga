import { NextRequest, NextResponse } from "next/server";

import { getServerApiBaseUrl } from "@/lib/auth/config";
import { getSessionToken } from "@/lib/auth/session";

const forwardedHeaders = [
  "content-disposition",
  "content-length",
  "content-type",
  "cache-control",
  "pragma",
];

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contractId: string; versionId: string }> },
) {
  const { contractId, versionId } = await context.params;

  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json(
      { message: "Sesi login tidak ditemukan." },
      { status: 401 },
    );
  }

  const backendUrl = `${getServerApiBaseUrl()}/api/v1/contracts/${contractId}/document-versions/${versionId}/download`;

  let backendResponse: Response;

  try {
    backendResponse = await fetch(backendUrl, {
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Layanan backend tidak dapat dijangkau." },
      { status: 503 },
    );
  }

  if (!backendResponse.ok) {
    const payload = await backendResponse.json().catch(() => ({
      message: "Terjadi kesalahan saat mengambil file.",
    }));

    return NextResponse.json(
      { message: payload.message ?? "Terjadi kesalahan saat mengambil file." },
      { status: backendResponse.status },
    );
  }

  const headers = new Headers();

  for (const headerName of forwardedHeaders) {
    const headerValue = backendResponse.headers.get(headerName);

    if (headerValue) {
      headers.set(headerName, headerValue);
    }
  }

  return new Response(backendResponse.body, {
    headers,
    status: backendResponse.status,
  });
}
