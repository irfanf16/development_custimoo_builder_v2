import type { ComputedRef, Ref } from 'vue'

export type BreadcrumbItem = { label: string; action?: () => void }

export type HeaderConfiguration = {
  breadcrumbs?: ComputedRef<BreadcrumbItem[]>
  search?: {
    placeholder: string
    model: Ref<string>
    onInput: (val: string) => void
  }
  applyOverrides?: {
    model: Ref<boolean>
    onInput: (val: boolean) => void
    label: string
  }
  actionButton?: {
    label: string
    tooltip?: string
    callback: () => void
  }
  isExpandable?: boolean
}

export type HeaderAndFooterConfiguration = {
  headerExtras?: HeaderConfiguration
}

export type WorkflowProductsEntryVariant = 'cards' | 'list'

export type WorkflowRouteStep =
  | 'product'
  | 'designs'
  | 'styles'
  | 'logos'
  | 'colors'
  | 'patterns'
  | 'texts'
  | 'texts-placement'
  | 'roster'
  | 'roster-edit'
  | 'summary'
