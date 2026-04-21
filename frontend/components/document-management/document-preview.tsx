'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import mammoth from 'mammoth'
import { FileTextIcon, FileImageIcon, Loader2Icon, AlertCircleIcon } from 'lucide-react'

const PdfPreview = dynamic(() => import('./pdf-preview'), { ssr: false })

type DocumentType = 'pdf' | 'word' | 'image' | 'unknown'

interface DocumentPreviewProps {
  url: string
  fileName?: string
  mimeType?: string
  className?: string
  contractId?: number
  versionId?: number
}

function detectDocumentType(url: string, mimeType?: string): DocumentType {
  if (mimeType) {
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('doc')) return 'word'
    if (mimeType.startsWith('image/')) return 'image'
  }
  
  const extension = url.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'pdf'
  if (extension === 'doc' || extension === 'docx') return 'word'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image'
  
  return 'unknown'
}

function WordPreview({ url }: { url: string }) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadWordDocument() {
      try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        setHtmlContent(result.value)
      } catch (err) {
        setError('Gagal memuat dokumen Word')
      } finally {
        setLoading(false)
      }
    }
    
    loadWordDocument()
  }, [url])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2Icon className="h-5 w-5 animate-spin" />
        <span>Memuat dokumen Word...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 text-destructive">
        <AlertCircleIcon className="h-8 w-8" />
        <p className="text-sm">{error}</p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm underline"
        >
          Download file
        </a>
      </div>
    )
  }

  return (
    <div 
      className="max-h-[600px] overflow-auto rounded-lg border bg-white p-8 prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

function ImagePreview({ url }: { url: string }) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 text-destructive">
        <AlertCircleIcon className="h-8 w-8" />
        <p className="text-sm">Gagal memuat gambar</p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm underline"
        >
          Buka gambar di tab baru
        </a>
      </div>
    )
  }

  return (
    <div className="relative max-h-[600px] overflow-auto">
      <Image
        src={url}
        alt="Document preview"
        width={800}
        height={600}
        className="h-auto w-full object-contain"
        onError={() => setError(true)}
      />
    </div>
  )
}

function UnknownPreview({ url, fileName }: { url: string; fileName?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <FileTextIcon className="h-16 w-16 text-muted-foreground" />
      <div>
        <p className="font-medium">Preview tidak tersedia</p>
        <p className="text-sm text-muted-foreground">
          {fileName || 'File ini tidak dapat dipreview langsung'}
        </p>
      </div>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
      >
        Download file
      </a>
    </div>
  )
}

export function DocumentPreview({ url, fileName, mimeType, className }: DocumentPreviewProps) {
  const docType = detectDocumentType(url, mimeType)

  return (
    <div className={`rounded-lg border bg-card p-4 ${className || ''}`}>
      {docType === 'pdf' && <PdfPreview url={url} />}
      {docType === 'word' && <WordPreview url={url} />}
      {docType === 'image' && <ImagePreview url={url} />}
      {docType === 'unknown' && <UnknownPreview url={url} fileName={fileName} />}
    </div>
  )
}
