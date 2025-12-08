import { computed, ref } from 'vue'
import * as XLSX from 'xlsx'
import type { APCustomizationRosterEntry } from '@/services/products/types'
import { useRoster } from './useRoster'
import { useProfileStore } from '@/stores/profile/profile.store'
import {
  roster_error_excel,
  roster_error_generic,
  roster_error_headers,
  roster_error_no_rows
} from '@/paraglide/messages'

import type { RosterColumnKey } from './types'

const EXCEL_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])
const SUPPORTED_EXTENSION = /\.xlsx$/i

const HEADER_TITLES: Record<RosterColumnKey, string> = {
  text: 'NAME ON PRODUCT',
  number: 'NUMBER',
  size: 'SIZE*',
  quantity: 'QUANTITY*'
}

function normalizeHeaderValue(value: unknown): string {
  if (typeof value === 'string') return value.trim().toUpperCase()
  if (typeof value === 'number') return String(value).trim().toUpperCase()
  return ''
}

function parseExcelRoster(buffer: ArrayBuffer): APCustomizationRosterEntry[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []

  const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json<
    (string | number | undefined)[]
  >(sheet, {
    header: 1,
    defval: '',
    blankrows: false
  })

  if (!rows.length) return []

  const headerRow = rows[0]?.map(value => normalizeHeaderValue(value)) || []
  const columnIndexes = Object.entries(HEADER_TITLES).reduce(
    (acc, [key, label]) => {
      acc[key as RosterColumnKey] = headerRow.indexOf(label)
      return acc
    },
    {} as Record<RosterColumnKey, number>
  )

  if (Object.values(columnIndexes).some(index => index === -1)) {
    throw new Error('missing_headers')
  }

  const entries: APCustomizationRosterEntry[] = []

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    if (!row) continue

    const name = String(row[columnIndexes.text] ?? '').trim()
    const number = String(row[columnIndexes.number] ?? '').trim()
    const size = String(row[columnIndexes.size] ?? '').trim()
    const quantityRaw = String(row[columnIndexes.quantity] ?? '').trim()

    if (!name && !number && !size && !quantityRaw) continue

    const parsedQuantity = Number.parseInt(quantityRaw, 10)

    entries.push({
      text: name,
      number,
      size,
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
    const isExcelFile =
      EXCEL_MIME_TYPES.has(file.type) || (file.name ? SUPPORTED_EXTENSION.test(file.name) : false)
    if (!isExcelFile) {
      importError.value = roster_error_excel({}, { locale: locale.value })
      return
    }

    isImporting.value = true
    importError.value = null
    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseExcelRoster(buffer)
      if (!parsed.length) {
        importError.value = roster_error_no_rows({}, { locale: locale.value })
        return
      }
      await replaceRoster(parsed)
      setLastImportSummary({
        fileName: file.name,
        totalRows: parsed.length,
        importedAt: new Date()
      })
      await ensureEditableRoster()
    } catch (error) {
      console.error(error)
      if (error instanceof Error && error.message === 'missing_headers') {
        importError.value = roster_error_headers({}, { locale: locale.value })
      } else {
        importError.value = roster_error_generic({}, { locale: locale.value })
      }
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
