"use client"

import { useEffect } from "react"

export function DiffStyles() {
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      .diff-table {
        width: 100%;
        border-collapse: collapse;
        font-family: ui-monospace, monospace;
        font-size: 13px;
        line-height: 1.5;
      }

      .diff-table td {
        padding: 4px 8px;
        vertical-align: top;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .diff-table .diff-line-num {
        width: 50px;
        text-align: right;
        color: #6b7280;
        background: #f9fafb;
        border-right: 1px solid #e5e7eb;
        user-select: none;
      }

      .diff-table .diff-line-content {
        padding-left: 12px;
      }

      .diff-table .diff-line-added {
        background: #dcfce7;
      }

      .diff-table .diff-line-added .diff-line-num {
        background: #bbf7d0;
      }

      .diff-table .diff-line-deleted {
        background: #fee2e2;
      }

      .diff-table .diff-line-deleted .diff-line-num {
        background: #fecaca;
      }

      .diff-table .diff-line-modified {
        background: #fef3c7;
      }

      .diff-table .diff-line-modified .diff-line-num {
        background: #fde68a;
      }

      .diff-table .diff-line-empty {
        background: #f9fafb;
      }

      .diff-table .diff-header {
        background: #f3f4f6;
        font-weight: 600;
        padding: 8px;
        border-bottom: 1px solid #e5e7eb;
      }

      .diff-table .diff-context {
        color: #9ca3af;
      }

      .diff-change-marker {
        display: inline-block;
        width: 12px;
        text-align: center;
        margin-right: 4px;
      }

      .diff-change-marker.added {
        color: #16a34a;
      }

      .diff-change-marker.deleted {
        color: #dc2626;
      }

      .diff-change-marker.modified {
        color: #d97706;
      }

      .dark .diff-table .diff-line-num {
        color: #9ca3af;
        background: #1f2937;
        border-right-color: #374151;
      }

      .dark .diff-table .diff-line-added {
        background: rgba(34, 197, 94, 0.1);
      }

      .dark .diff-table .diff-line-added .diff-line-num {
        background: rgba(34, 197, 94, 0.2);
      }

      .dark .diff-table .diff-line-deleted {
        background: rgba(239, 68, 68, 0.1);
      }

      .dark .diff-table .diff-line-deleted .diff-line-num {
        background: rgba(239, 68, 68, 0.2);
      }

      .dark .diff-table .diff-line-modified {
        background: rgba(234, 179, 8, 0.1);
      }

      .dark .diff-table .diff-line-modified .diff-line-num {
        background: rgba(234, 179, 8, 0.2);
      }

      .dark .diff-table .diff-header {
        background: #374151;
        border-bottom-color: #4b5563;
      }

      .dark .diff-change-marker.added {
        color: #4ade80;
      }

      .dark .diff-change-marker.deleted {
        color: #f87171;
      }

      .dark .diff-change-marker.modified {
        color: #facc15;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return null
}