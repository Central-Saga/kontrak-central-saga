"use client"

import { useState, useRef, FormEvent } from "react"
import { UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DocumentUploadFormProps = {
  uploadAction: (formData: FormData) => Promise<void>
  contractEditHref: string
}

export function DocumentUploadForm({ uploadAction, contractEditHref }: DocumentUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      await uploadAction(formData)
      // Reset form on success
      if (formRef.current) {
        formRef.current.reset()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah dokumen.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col gap-6"
    >
      <input name="document_type" type="hidden" value="main_contract" />

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="contract-document-file">File dokumen</FieldLabel>
          <Input
            accept=".pdf,.doc,.docx"
            id="contract-document-file"
            name="file"
            required
            type="file"
            disabled={isUploading}
          />
          <FieldDescription>
            Gunakan PDF atau dokumen kerja final agar arsip versi tetap mudah diverifikasi.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="contract-document-version-status">Status versi</FieldLabel>
          <Select name="version_status" defaultValue="draft" disabled={isUploading}>
            <SelectTrigger id="contract-document-version-status" className="w-full">
              <SelectValue placeholder="Pilih status versi" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="contract-document-change-summary">Ringkasan perubahan</FieldLabel>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-hidden transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            id="contract-document-change-summary"
            name="change_summary"
            placeholder="Contoh: Penyesuaian pasal pembayaran termin ketiga setelah review legal."
            disabled={isUploading}
          />
          <FieldDescription>
            Catatan singkat ini akan tampil di timeline versi dan panel perbandingan metadata.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" type="submit" disabled={isUploading}>
          <UploadIcon
            aria-hidden
            data-icon="inline-start"
            className={isUploading ? "animate-spin" : ""}
          />
          {isUploading ? "Mengunggah..." : "Unggah versi baru"}
        </Button>
        <p className="text-sm text-muted">Jenis dokumen yang diarsipkan: kontrak utama.</p>
      </div>
    </form>
  )
}
