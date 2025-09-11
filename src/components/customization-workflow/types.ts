import type { ComputedRef, Ref } from 'vue'

export type BreadcrumbItem = { label: string; action?: () => void }

export type WorkflowRouteStep =
  | 'category'
  | 'subcategory'
  | 'product'
  | 'designs'
  | 'styles'
  | 'logos'
  | 'colors'
  | 'patterns'
  | 'patterns-group'
  | 'texts'
  | 'texts-placement'
  | 'roster'
  | 'roster-edit'
  | 'summary'

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
  isExpandable?: boolean
}

export type HeaderAndFooterConfiguration = {
  headerExtras?: HeaderConfiguration
}
