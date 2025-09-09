import type { OutputColor } from '@/services/products/types'
import type { useCustomizationStore } from '@/stores/customization/customization.store'
import type { useProductsStore } from '@/stores/products/products.store'
import type { useWorkflowStore } from '@/stores/workflow/workflow.store'
import type { APCustomizationLogo } from '@/services/products/types'

export type HistoryActionType =
  | 'color.set-group'
  | 'text.set-value'
  | 'logo.add'
  | 'logo.remove'
  | 'logo.move'
  | 'pattern.set-group'
  | 'batch'

export interface HistoryEntry<T = any> {
  id: string
  type: HistoryActionType
  payload: T
  description: string
}

export interface HistoryContext {
  customizationStore: ReturnType<typeof useCustomizationStore>
  productsStore: ReturnType<typeof useProductsStore>
  workflowStore: ReturnType<typeof useWorkflowStore>
}

export type ColorSetGroupPayload = {
  groupId: string
  prevColor: OutputColor | null
  nextColor: OutputColor
}

export type TextSetValuePayload = {
  key: string // map key (e.g., product id string)
  index: number // index within the array
  prevValue: string
  nextValue: string
}

export type LogoAddPayload = {
  key: string
  logo: APCustomizationLogo
  index?: number
}

export type LogoRemovePayload = {
  key: string
  index: number
  logo?: APCustomizationLogo
}

export type LogoMovePayload = {
  key: string
  from: number
  to: number
}

export type PatternSetGroupPayload = {
  groupName: string
  prev: unknown
  next: unknown
}
