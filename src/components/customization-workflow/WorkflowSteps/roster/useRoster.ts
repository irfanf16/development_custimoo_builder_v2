import { computed, ref } from 'vue'
import type { APCustomizationRosterEntry } from '@/services/products/types'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'

type RosterImportSummary = {
  fileName: string
  totalRows: number
  importedAt: Date
}

const FALLBACK_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL']
const lastImportSummary = ref<RosterImportSummary | null>(null)

export function useRoster() {
  const customizationStore = useCustomizationStore()
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()

  const rosterEntries = computed(() => customizationStore.rosterEntries)
  const hasEntries = computed(() => rosterEntries.value.length > 0)

  const availableSizes = computed(() => {
    const sizeSet = new Set<string>()
    const productSizes = productsStore.activeProductDetails?.sizes
    productSizes?.forEach(sizeFile => {
      sizeFile.json_data?.forEach(item => {
        if (item.name?.trim()) {
          sizeSet.add(item.name.trim())
        }
      })
    })
    if (sizeSet.size === 0) return FALLBACK_SIZES
    return Array.from(sizeSet)
  })

  function addEmptyRow(payload?: Partial<APCustomizationRosterEntry>) {
    customizationStore.addRosterEntry({
      text: '',
      number: '',
      size: availableSizes.value[0] || '',
      quantity: 1,
      information: '',
      ...payload
    })
  }

  function updateRow(index: number, payload: Partial<APCustomizationRosterEntry>) {
    customizationStore.updateRosterEntry(index, payload)
  }

  function removeRow(index: number) {
    customizationStore.removeRosterEntry(index)
  }

  function replaceRoster(entries: APCustomizationRosterEntry[]) {
    customizationStore.setRosterEntries(entries)
  }

  function ensureEditableRoster() {
    workflowStore.setRosterSubStep('edit')
    if (!hasEntries.value) {
      addEmptyRow()
    }
  }

  function resetRoster() {
    customizationStore.clearRosterEntries()
    workflowStore.setRosterSubStep('list')
    lastImportSummary.value = null
  }

  function setLastImportSummary(summary: RosterImportSummary | null) {
    lastImportSummary.value = summary
  }

  function downloadTemplate() {
    if (typeof window === 'undefined') return
    const header = ['Name', 'Number', 'Size', 'Quantity']
    const sizes = availableSizes.value.length > 0 ? availableSizes.value : FALLBACK_SIZES
    const sampleRows = sizes
      .slice(0, 3)
      .map((size, index) => [`Player ${index + 1}`, `${index + 10}`, size, '1'])
    const csv = [header, ...sampleRows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'custimoo-roster-template.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return {
    rosterEntries,
    availableSizes,
    hasEntries,
    addEmptyRow,
    updateRow,
    removeRow,
    replaceRoster,
    ensureEditableRoster,
    resetRoster,
    lastImportSummary,
    setLastImportSummary,
    downloadTemplate
  }
}

export type { RosterImportSummary }
