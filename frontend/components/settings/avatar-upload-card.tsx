"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { buttonVariants, Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type AvatarUploadCardProps = {
  name: string
}

const allowedImageTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"])

export function AvatarUploadCard({ name }: AvatarUploadCardProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    const avatar = formData.get("avatar")

    if (!(avatar instanceof File) || avatar.size === 0) {
      toast.error("Perlu perhatian", {
        description: "Pilih file foto profil terlebih dahulu.",
      })
      return
    }

    if (!allowedImageTypes.has(avatar.type)) {
      toast.error("Perlu perhatian", {
        description: "Gunakan berkas gambar JPG, PNG, WEBP, atau GIF.",
      })
      return
    }

    startTransition(async () => {
      const body = new FormData()
      body.set("avatar", avatar)

      const response = await fetch("/api/account/avatar", {
        method: "POST",
        body,
      }).catch(() => null)

      if (!response) {
        toast.error("Perlu perhatian", {
          description: "Layanan unggah avatar sedang tidak tersedia. Silakan coba lagi.",
        })
        return
      }

      const payload = (await response.json().catch(() => null)) as { message?: string } | null

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }

        toast.error("Perlu perhatian", {
          description: payload?.message ?? "Foto profil belum berhasil diperbarui.",
        })
        return
      }

      toast.success("Perubahan tersimpan", {
        description: `${name} sekarang memakai foto profil terbaru.`,
      })

      formRef.current?.reset()
      setSelectedFileName(null)
      router.refresh()
    })
  }

  return (
    <Card className="rounded-[2rem] bg-card-strong shadow-none">
      <CardHeader className="gap-3 p-6">
        <CardTitle className="text-xl">Perbarui avatar</CardTitle>
        <CardDescription>
          Gunakan gambar JPG, PNG, WEBP, atau GIF. Avatar baru akan langsung dipakai oleh menu pengguna dan halaman profil setelah perubahan tersimpan.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form action={handleSubmit} className="flex flex-col gap-5" ref={formRef}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-photo-input">Berkas foto</FieldLabel>
              <Input
                accept="image/gif,image/jpeg,image/png,image/webp"
                data-testid="profile-photo-input"
                id="profile-photo-input"
                name="avatar"
                onChange={(event) => setSelectedFileName(event.currentTarget.files?.[0]?.name ?? null)}
                type="file"
              />
              <FieldDescription>
                {selectedFileName ? `Berkas terpilih: ${selectedFileName}` : "Pilih satu berkas gambar yang mewakili identitas akun Anda dengan jelas."}
              </FieldDescription>
            </Field>
          </FieldGroup>

          <div className="flex flex-wrap items-center gap-3">
            <Button data-testid="profile-photo-submit" disabled={isPending} size="lg" type="submit">
              {isPending ? <Spinner /> : null}
              {isPending ? "Mengunggah avatar..." : "Unggah avatar"}
            </Button>
            <Link className={buttonVariants({ size: "lg", variant: "outline" })} href="/app/profile">
              Lihat profil
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
