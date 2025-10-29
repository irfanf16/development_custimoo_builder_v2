export type BreadcrumbItem = { label: string; action?: () => void }

export type HeaderConfiguration = {
  breadcrumbs?: BreadcrumbItem[]
  search?: {
    placeholder: string
    onInput: (val: string) => void
  }
  applyOverrides?: {
    onInput: (val: boolean) => void
    label: string
  }
  actionButton?: {
    label: string
    tooltip?: string
    callback: () => void
  }
  isExpandable?: boolean
  designCategories?: {
    categories: Array<{ category_name: string; created_at: string; id: number; updated_at: string }>
    selectedId: number | null
    onSelect: (id: number | null) => void
    defaultLabel?: string
  }
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
