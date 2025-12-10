import { computed, ref, watch } from 'vue'
import type { APCustomizationRosterEntry } from '@/services/products/types'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useHistoryStore } from '@/stores/history/history.store'
import { API } from '@/services'

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
  const historyStore = useHistoryStore()

  const rosterEntries = computed(() => customizationStore.rosterEntries)
  const hasEntries = computed(() => rosterEntries.value.length > 0)

  const presetNameId = computed(() => {
    const productTexts = productsStore.activeProductDetails?.product_texts
    if (!productTexts) return undefined
    return productTexts.find(text => text.type === 'name' && text.is_first_name)?.id
  })

  const presetNumberId = computed(() => {
    const productTexts = productsStore.activeProductDetails?.product_texts
    if (!productTexts) return undefined
    return productTexts.find(text => text.type === 'number' && text.is_first_number)?.id
  })

  const customizedPresetName = computed(() => {
    if (!presetNameId.value) return undefined
    return customizationStore.activeProductTexts.find(text => text.id === presetNameId.value)?.value
  })

  const customizedPresetNumber = computed(() => {
    if (!presetNumberId.value) return undefined
    return customizationStore.activeProductTexts.find(text => text.id === presetNumberId.value)
      ?.value
  })

  const productId = computed(
    () => customizationStore.activeProductId ?? productsStore.activeProductDetails?.id ?? null
  )
  const rosterKey = computed(() => (productId.value ? String(productId.value) : ''))

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

  watch(hasEntries, () => {
    if (!hasEntries.value) {
      workflowStore.setRosterSubStep('list')
    }
  })

  async function addEmptyRow(payload?: Partial<APCustomizationRosterEntry>) {
    if (!rosterKey.value) return

    const entry: APCustomizationRosterEntry = {
      text: payload?.text ?? '',
      number: payload?.number ?? '',
      size: payload?.size ?? availableSizes.value[0] ?? '',
      quantity: payload?.quantity ?? 1,
      information: payload?.information ?? ''
    }

    await historyStore.execute('roster.add-entry', {
      key: rosterKey.value,
      entry,
      index: rosterEntries.value.length
    })
  }

  async function updateRow(index: number, payload: Partial<APCustomizationRosterEntry>) {
    if (!rosterKey.value) return
    if (index < 0 || index >= rosterEntries.value.length) return

    const currentEntry = rosterEntries.value[index]
    if (!currentEntry) return

    // Update each field that changed using the appropriate history action
    if (payload.text !== undefined && payload.text !== currentEntry.text) {
      await historyStore.execute('roster.update-name', {
        key: rosterKey.value,
        index,
        prevName: currentEntry.text,
        nextName: payload.text
      })
    }

    if (payload.number !== undefined && payload.number !== currentEntry.number) {
      await historyStore.execute('roster.update-number', {
        key: rosterKey.value,
        index,
        prevNumber: currentEntry.number,
        nextNumber: payload.number
      })
    }

    if (payload.size !== undefined && payload.size !== currentEntry.size) {
      await historyStore.execute('roster.update-size', {
        key: rosterKey.value,
        index,
        prevSize: currentEntry.size,
        nextSize: payload.size
      })
    }

    if (payload.quantity !== undefined && payload.quantity !== currentEntry.quantity) {
      await historyStore.execute('roster.update-quantity', {
        key: rosterKey.value,
        index,
        prevQuantity: currentEntry.quantity,
        nextQuantity: payload.quantity
      })
    }
  }

  async function removeRow(index: number) {
    if (!rosterKey.value) return
    if (index < 0 || index >= rosterEntries.value.length) return

    await historyStore.execute('roster.remove-entry', {
      key: rosterKey.value,
      index
    })
  }

  async function replaceRoster(entries: APCustomizationRosterEntry[]) {
    if (!rosterKey.value) return

    // Use batch operation to replace all entries atomically
    await historyStore.runBatch('Replace roster', add => {
      // Remove all existing entries (in reverse order to maintain indices)
      for (let i = rosterEntries.value.length - 1; i >= 0; i--) {
        add('roster.remove-entry', {
          key: rosterKey.value,
          index: i
        })
      }

      // Add all new entries
      entries.forEach((entry, index) => {
        add('roster.add-entry', {
          key: rosterKey.value,
          entry,
          index
        })
      })
    })
  }

  async function ensureEditableRoster() {
    workflowStore.setRosterSubStep('edit')
    if (!hasEntries.value) {
      await addEmptyRow({
        text: customizedPresetName.value,
        number: customizedPresetNumber.value
      })
    }
  }

  function resetRoster() {
    customizationStore.clearRosterEntries()
    lastImportSummary.value = null
  }

  function setLastImportSummary(summary: RosterImportSummary | null) {
    lastImportSummary.value = summary
  }

  async function downloadTemplate() {
    if (typeof window === 'undefined') return
    const productId = productsStore.activeProductDetails?.id
    if (!productId) {
      console.error('No active product found')
      return
    }

    try {
      const response = await API.products.downloadRosterTemplate(productId)
      if (response.status === 200 && response.data) {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'custimoo-roster-template.xlsx'
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download template:', error)
    }
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
    downloadTemplate,
    presetNameId,
    presetNumberId,
    customizedPresetName,
    customizedPresetNumber
  }
}

export type { RosterImportSummary }
