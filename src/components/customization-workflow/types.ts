import type { ButtonVariants } from '../ui/button'

export type BreadcrumbItem = { label: string; action?: () => void }

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
