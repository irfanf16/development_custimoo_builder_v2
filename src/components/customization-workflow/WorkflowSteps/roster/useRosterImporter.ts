import { computed, ref } from 'vue'
import type { APCustomizationRosterEntry } from '@/services/products/types'
import { useRoster } from './useRoster'
import { useProfileStore } from '@/stores/profile/profile.store'
import {
  roster_error_excel,
  roster_error_generic,
  roster_error_no_rows
} from '@/paraglide/messages'

const EXCEL_MIME_TYPES = new Set([
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])

function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t'
  if (line.includes(';')) return ';'
  return ','
}

function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current.trim())
  return cells
}

function parseRosterText(text: string): APCustomizationRosterEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (!lines.length) return []

  const firstLine = lines[0]!
  const delimiter = detectDelimiter(firstLine)
  let startIndex = 0
  const headerTokens = splitLine(firstLine, delimiter).map(token => token.toLowerCase())
  const headerLooksValid = headerTokens.some(token =>
    ['name', 'player', 'number', 'size', 'qty', 'quantity'].some(key => token.includes(key))
  )
  if (headerLooksValid) {
    startIndex = 1
  }

  const entries: APCustomizationRosterEntry[] = []
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line) continue
    const cells = splitLine(line, delimiter)
    if (cells.every(cell => !cell)) continue
    const [name = '', number = '', size = '', quantityRaw = ''] = cells
    const parsedQuantity = Number(quantityRaw)
    entries.push({
      text: name,
      number: number,
      size: size,
      quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1,
      information: ''
    })
  }

  return entries
}

export function useRosterImporter() {
  const isDragging = ref(false)
  const importError = ref<string | null>(null)
  const isImporting = ref(false)

  const { replaceRoster, ensureEditableRoster, setLastImportSummary } = useRoster()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragging.value = true
    importError.value = null
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
  }

  async function importFile(file: File) {
    if (!file) return
    if (EXCEL_MIME_TYPES.has(file.type) || /\.xlsx?$/i.test(file.name)) {
      importError.value = roster_error_excel({}, { locale: locale.value })
      return
    }

    isImporting.value = true
    importError.value = null
    try {
      const fileContents = await file.text()
      const parsed = parseRosterText(fileContents)
      if (!parsed.length) {
        importError.value = roster_error_no_rows({}, { locale: locale.value })
        return
      }
      replaceRoster(parsed)
      setLastImportSummary({
        fileName: file.name,
        totalRows: parsed.length,
        importedAt: new Date()
      })
      ensureEditableRoster()
    } catch (error) {
      console.error(error)
      importError.value = roster_error_generic({}, { locale: locale.value })
    } finally {
      isImporting.value = false
      isDragging.value = false
    }
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      await importFile(file)
    }
  }

  return {
    isDragging,
    isImporting,
    importError,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    importFile
  }
}
