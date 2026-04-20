import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contractId: string; versionId: string }> }
) {
  const { contractId, versionId } = await params;
  
  const cookieStore = await cookies();
  const token = cookieStore.get("kcs_session_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Sesi Anda sudah tidak valid." },
      { status: 401 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

  try {
    const response = await fetch(
      `${baseUrl}/v1/contracts/${contractId}/document-versions/${versionId}/download`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (response.status === 401) {
      return NextResponse.json(
        { message: "Sesi Anda sudah tidak valid." },
        { status: 401 }
      );
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Dokumen tidak ditemukan." }));
      return NextResponse.json(
        { message: error.message || "Dokumen tidak ditemukan." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const fileUrl = data.data?.url;

    if (!fileUrl) {
      return NextResponse.json(
        { message: "File tidak tersedia." },
        { status: 404 }
      );
    }

    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      return NextResponse.json(
        { message: "Gagal mengambil file dari server." },
        { status: fileResponse.status }
      );
    }

    const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
    const fileName = data.data?.file_name || "document";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `inline; filename="${fileName}"`);

    return new NextResponse(fileResponse.body, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengunduh file." },
      { status: 500 }
    );
  }
}
