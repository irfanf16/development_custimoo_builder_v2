/**
 * Build storage-relative path from API `file_url` + `file_extension` columns
 * without duplicating the extension (e.g. avoid `design.svg.svg`).
 */
export function buildDesignFileStoragePath(fileUrl: string, fileExtension?: string | null): string {
  const base = fileUrl.trim()
  if (!base) return ''
  const ext = String(fileExtension ?? '')
    .replace(/^\./, '')
    .toLowerCase()
  if (!ext) return base
  if (base.toLowerCase().endsWith(`.${ext}`)) return base
  return `${base.replace(/\/$/, '')}.${ext}`
}
