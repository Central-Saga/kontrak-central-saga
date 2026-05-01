'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Loader2Icon, AlertCircleIcon } from 'lucide-react'

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.min.mjs`
}

export default function PdfPreview({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
  }

  function onDocumentLoadError(error: Error) {
    setError('Gagal memuat PDF: ' + error.message)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2Icon className="h-5 w-5 animate-spin" />
          <span>Memuat PDF...</span>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center gap-2 text-destructive">
          <AlertCircleIcon className="h-8 w-8" />
          <p className="text-sm">{error}</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            Buka file di tab baru
          </a>
        </div>
      ) : (
        <>
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2Icon className="h-5 w-5 animate-spin" />
                <span>Memuat PDF...</span>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
            />
          </Document>
          
          {numPages > 1 && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-muted-foreground">
                Halaman {pageNumber} dari {numPages}
              </span>
              <button
                onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                disabled={pageNumber >= numPages}
                className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
