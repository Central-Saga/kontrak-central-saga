import { NextResponse } from "next/server"

import { uploadCurrentUserAvatar } from "@/lib/auth/backend"
import { isAuthError } from "@/lib/auth/errors"
import { clearSessionToken, getSessionToken } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const token = await getSessionToken()

  if (!token) {
    return NextResponse.json({ message: "Sesi Anda sudah tidak valid." }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const avatar = formData.get("avatar")

    if (!(avatar instanceof File) || avatar.size === 0) {
      return NextResponse.json({ message: "Pilih file foto profil terlebih dahulu." }, { status: 422 })
    }

    const user = await uploadCurrentUserAvatar(token, avatar)

    return NextResponse.json({ data: user })
  } catch (error) {
    if (isAuthError(error)) {
      if (error.code === "unauthorized") {
        await clearSessionToken()
      }

      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 })
    }

    return NextResponse.json({ message: "Foto profil belum berhasil diperbarui. Silakan coba beberapa saat lagi." }, { status: 500 })
  }
}
