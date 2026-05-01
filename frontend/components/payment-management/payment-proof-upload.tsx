"use client";

import { UploadIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PaymentProofUpload() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Bukti Pembayaran</CardTitle>
        <CardDescription>
          Komponen upload bukti pembayaran kini digantikan oleh form operasional yang terintegrasi langsung di halaman detail kontrak.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
        <UploadIcon className="size-4" />
        Gunakan form upload pada detail kontrak untuk menambahkan bukti pembayaran ke termin terkait.
      </CardContent>
    </Card>
  );
}
