import type {
  APCustomizationRosterEntry,
  OutputColor,
  OutputProductText
} from '@/services/products/types'
import type { useCustomizationStore } from '@/stores/customization/customization.store'
import type { useProductsStore } from '@/stores/products/products.store'
import type { useWorkflowStore } from '@/stores/workflow/workflow.store'
import type { APCustomizationLogo } from '@/services/products/types'

export type HistoryActionType =
  | 'color.set-group'
  | 'text.set-value'
  | 'text.add-entry'
  | 'text.update-entry'
  | 'text.remove-entry'
  | 'text.update-value'
  | 'text.update-font'
  | 'text.update-color'
  | 'text.update-outline-color'
  | 'text.update-outline-width'
  | 'text.update-height'
  | 'text.update-width'
  | 'text.update-rotation'
  | 'text.update-placement'
  | 'text.update-scale'
  | 'logo.add'
  | 'logo.remove'
  | 'logo.move'
  | 'logo.remove-background'
  | 'logo.update-placement'
  | 'logo.update-size'
  | 'logo.update-rotation'
  | 'logo.recolor'
  | 'pattern.set-group'
  | 'addons.set'
  | 'roster.add-entry'
  | 'roster.remove-entry'
  | 'roster.update-name'
  | 'roster.update-number'
  | 'roster.update-size'
  | 'roster.update-quantity'
  | 'batch'

export interface HistoryEntry<T = unknown> {
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
  gradientIndex?: number
}

export type TextSetValuePayload = {
  key: string // map key (e.g., product id string)
  index: number // index within the array
  prevValue: string
  nextValue: string
}

export type TextAddEntryPayload = {
  key: string
  entry: OutputProductText
  index?: number
}

export type TextRemoveEntryPayload = {
  key: string
  index: number
  entry?: OutputProductText
}

export type TextUpdateEntryPayload = {
  key: string
  textId: number // ID of the text entry
  index?: number // Optional index for backward compatibility
  prev?: OutputProductText
  next: OutputProductText
}

export type TextUpdateValuePayload = {
  key: string
  textId: number
  itemIndex: number
  prevValue: string
  nextValue: string
}

export type TextUpdateFontPayload = {
  key: string
  textId: number
  itemIndex: number
  prevFont: string
  nextFont: string
}

export type TextUpdateColorPayload = {
  key: string
  textId: number
  itemIndex: number
  prevColor: string
  nextColor: string
}

export type TextUpdateOutlineColorPayload = {
  key: string
  textId: number
  itemIndex: number
  prevColor: string
  nextColor: string
}

export type TextUpdateOutlineEnabledPayload = {
  key: string
  textId: number
  itemIndex: number
  prevEnabled: boolean
  nextEnabled: boolean
}

export type TextUpdateOutlineWidthPayload = {
  key: string
  textId: number
  itemIndex: number
  prevWidth: number
  nextWidth: number
}

export type TextUpdateHeightPayload = {
  key: string
  textId: number
  itemIndex: number
  prevHeight: string
  nextHeight: string
}

export type TextUpdateWidthPayload = {
  key: string
  textId: number
  itemIndex: number
  prevWidth: string
  nextWidth: string
}

export type TextUpdateRotationPayload = {
  key: string
  textId: number
  itemIndex: number
  prevRotation: string
  nextRotation: string
}

export type TextUpdatePlacementPayload = {
  key: string
  textId: number
  itemIndex: number
  prevPlacement: 'Front' | 'Back'
  nextPlacement: 'Front' | 'Back'
}

export type TextUpdateScalePayload = {
  key: string
  textId: number
  itemIndex: number
  prevScaleX: number
  prevScaleY: number
  nextScaleX: number
  nextScaleY: number
}

export type RosterAddEntryPayload = {
  key: string
  entry: APCustomizationRosterEntry
  index?: number
}

export type RosterRemoveEntryPayload = {
  key: string
  index: number
  entry?: APCustomizationRosterEntry
}

export type RosterUpdateNamePayload = {
  key: string
  index: number
  prevName: string
  nextName: string
}

export type RosterUpdateNumberPayload = {
  key: string
  index: number
  prevNumber: string
  nextNumber: string
}

export type RosterUpdateSizePayload = {
  key: string
  index: number
  prevSize: string
  nextSize: string
}

export type RosterUpdateQuantityPayload = {
  key: string
  index: number
  prevQuantity: number
  nextQuantity: number
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

export type LogoUpdateUrlPayload = {
  key: string // product key
  index: number // logo index in array
  prevLogo: APCustomizationLogo // full logo state before change
  nextLogo: APCustomizationLogo // full logo state after change
}

export type LogoUpdatePlacementPayload = {
  key: string
  index: number
  prevPlacementLabel: string | null
  nextPlacementLabel: string | null
  placementId?: number | null
  nextX?: number | null
  nextY?: number | null
  prevX?: number | null
  prevY?: number | null
  nextSide?: 'front' | 'back' | null
  prevSide?: 'front' | 'back' | null
  nextPlacementKey?: string | null
  prevPlacementKey?: string | null
}

export type LogoUpdateSizePayload = {
  key: string
  index: number
  prevWidth: number
  prevHeight: number
  nextWidth: number
  nextHeight: number
}

export type LogoUpdateRotationPayload = {
  key: string
  index: number
  prevRotation: number
  nextRotation: number
}

export type LogoRecolorPayload = {
  key: string
  index: number
  prevImage: string
  nextImage: string
}

export type PatternSetGroupPayload = {
  groupName: string
  prev: unknown
  next: unknown
}

export type AddonsSetPayload = {
  productId: number
  prevIds: number[]
  nextIds: number[]
}

export type LogoPlacementOption = {
  label: string
  value: string
}
