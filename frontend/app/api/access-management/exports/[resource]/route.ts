import { NextRequest, NextResponse } from "next/server";

import {
  exportAccessManagementDataset,
  isAccessManagementError,
  type AccessManagementExportResource,
} from "@/lib/access-management/backend";
import { clearSessionToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const exportFormats = new Set(["csv", "pdf"]);
const exportResources = new Set<AccessManagementExportResource>(["permissions", "roles", "users"]);
const forwardedHeaders = ["cache-control", "content-disposition", "content-length", "content-type", "pragma"];

function isExportResource(value: string): value is AccessManagementExportResource {
  return exportResources.has(value as AccessManagementExportResource);
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/access-management/exports/[resource]">,
) {
  const { resource } = await context.params;
  const format = request.nextUrl.searchParams.get("format");

  if (!isExportResource(resource)) {
    return NextResponse.json({ message: "Modul ekspor tidak ditemukan." }, { status: 404 });
  }

  if (!format || !exportFormats.has(format)) {
    return NextResponse.json({ message: "Format ekspor harus berupa CSV atau PDF." }, { status: 400 });
  }

  try {
    const backendResponse = await exportAccessManagementDataset(resource, request.nextUrl.searchParams);
    const headers = new Headers();

    for (const headerName of forwardedHeaders) {
      const headerValue = backendResponse.headers.get(headerName);

      if (headerValue) {
        headers.set(headerName, headerValue);
      }
    }

    if (!headers.has("content-disposition")) {
      headers.set("content-disposition", `attachment; filename="${resource}.${format}"`);
    }

    if (!headers.has("content-type")) {
      headers.set("content-type", format === "pdf" ? "application/pdf" : "text/csv; charset=utf-8");
    }

    return new Response(backendResponse.body, {
      headers,
      status: backendResponse.status,
    });
  } catch (error) {
    if (isAccessManagementError(error)) {
      if (error.status === 401) {
        await clearSessionToken();
      }

      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "Terjadi masalah saat menyiapkan file ekspor." }, { status: 500 });
  }
}
