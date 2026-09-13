/** Comma-separated export for whatever the clinic's accountant uses. */

function cell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  // A field containing a comma, a quote or a newline has to be quoted, and a
  // quote inside it doubled. Without this one patient name with a comma in it
  // shifts every column after it.
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, csv: string): void {
  // The BOM is what makes Excel read the Arabic names as UTF-8 instead of
  // mojibake. Every other reader ignores it.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
