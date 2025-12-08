export type LogosSubStep = 'list' | 'placement' | 'edit'
export type ProductsSubStep = 'category' | 'subcategory' | 'product'
export type PatternsSubStep = 'list' | 'edit'
export type TextsSubStep = 'list' | 'placement' | 'edit' | 'number-font'
export type RosterSubStep = 'list' | 'edit'
export type CanvasSide = 'front' | 'back' | '3d'

export type WorkflowBaseStep =
  | 'product'
  | 'designs'
  | 'styles'
  | 'logos'
  | 'colors'
  | 'patterns'
  | 'texts'
  | 'roster'
  | 'summary'

export type CustomizerStep = WorkflowBaseStep

export type WorkflowRouteStep =
  | 'product'
  | 'designs'
  | 'styles'
  | 'logos'
  | 'colors'
  | 'patterns'
  | 'texts'
  | 'roster'
  | 'roster-edit'
  | 'summary'

export type NavigationItem = {
  label: string
  action?: () => void
  isActive?: boolean
}
