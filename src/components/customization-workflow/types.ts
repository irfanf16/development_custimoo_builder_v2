import type { ButtonVariants } from '../ui/button'

export type BreadcrumbItem = { label: string; action?: () => void }

export type DesignCategoriesConfig = {
  categories: Array<{ category_name: string; created_at: string; id: number; updated_at: string }>
  selectedId: number | null
  onSelect: (id: number | null) => void
  defaultLabel?: string
}
export type HeaderConfiguration = {
  breadcrumbs?: BreadcrumbItem[]
  search?: {
    placeholder: string
    onInput: (val: string) => void
  }
  applyOverrides?: {
    value?: boolean
    onInput: (val: boolean) => void
    label: string
  }
  actionButton?: {
    label: string
    tooltip?: string
    callback: () => void
  }
  isExpandable?: boolean
  designCategories?: DesignCategoriesConfig
}

export type FooterButton = {
  label: string
  variant: ButtonVariants['variant']
  disabled?: boolean
  onClick: () => void
}

export type FooterConfiguration = {
  buttons: FooterButton[]
}

export type HeaderAndFooterConfiguration = {
  headerExtras?: HeaderConfiguration
  footerExtras?: FooterConfiguration
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
