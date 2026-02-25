import type { BreadcrumbItem } from '../types'
import type {
  LogosSubStep,
  ProductsSubStep,
  TextsSubStep
} from '@/stores/workflow/workflow.store.types'
import type { Category } from '@/services/products/types/categories'
import type { ParaglideLocale } from '@/services/preferences/types'
import {
  breadcrumbs_select_product,
  breadcrumbs_category,
  breadcrumbs_designs,
  breadcrumbs_logos,
  breadcrumbs_controls,
  breadcrumbs_placement,
  breadcrumbs_texts,
  breadcrumbs_number,
  breadcrumbs_edit,
  nav_color
} from '@/paraglide/messages'

type MaybeNumber = number | null | undefined

export type ProductBreadcrumbParams = {
  hasCategories: boolean
  productsSubStep: ProductsSubStep | null | undefined
  categories: Category[] | undefined
  selectedCategoryId: MaybeNumber
  activeCategoryId: MaybeNumber
  selectedSubCategoryId: MaybeNumber
  activeSubCategoryId: MaybeNumber
  onCategoryStep?: () => void
  onSubCategoryStep?: () => void
  locale?: ParaglideLocale
}

export function buildProductBreadcrumbs({
  hasCategories,
  productsSubStep,
  categories,
  selectedCategoryId,
  activeCategoryId,
  selectedSubCategoryId,
  activeSubCategoryId,
  onCategoryStep,
  onSubCategoryStep,
  locale
}: ProductBreadcrumbParams): BreadcrumbItem[] {
  if (!hasCategories) {
    return [{ label: breadcrumbs_select_product({}, { locale }) }]
  }

  const categoryLabelTranslation = breadcrumbs_category({}, { locale })

  if (productsSubStep === 'category') {
    return [{ label: categoryLabelTranslation }]
  }

  const categoryId = selectedCategoryId ?? activeCategoryId ?? null
  const subCategoryId = selectedSubCategoryId ?? activeSubCategoryId ?? null

  const category = categories?.find(cat => cat.id === categoryId) ?? null
  const hasSubcategories = !!(category && category.subcategories && category.subcategories.length)

  if (productsSubStep === 'subcategory') {
    return [
      { label: categoryLabelTranslation, action: onCategoryStep },
      { label: category?.category_name || '—' }
    ]
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: categoryLabelTranslation, action: onCategoryStep }
  ]

  const selectedCategoryLabel = category?.category_name || '—'
  if (selectedCategoryLabel) {
    breadcrumbs.push({
      label: selectedCategoryLabel,
      action: hasSubcategories ? onSubCategoryStep : undefined
    })
  }

  if (hasSubcategories) {
    const selectedSubcategory =
      subCategoryId && category
        ? category.subcategories?.find(sub => sub.id === subCategoryId)
        : undefined

    if (selectedSubcategory) {
      breadcrumbs.push({ label: selectedSubcategory.category_name })
    }
  }

  return breadcrumbs
}

export function buildDesignBreadcrumbs(locale?: ParaglideLocale): BreadcrumbItem[] {
  return [{ label: breadcrumbs_designs({}, { locale }) }]
}

export function buildLogoBreadcrumbs({
  logosSubStep,
  hasActiveLogo,
  onBackToList,
  locale
}: {
  logosSubStep: LogosSubStep
  hasActiveLogo: boolean
  onBackToList?: () => void
  locale?: ParaglideLocale
}): BreadcrumbItem[] {
  const logosLabel = breadcrumbs_logos({}, { locale })
  const controlsLabel = breadcrumbs_controls({}, { locale })
  const placementLabel = breadcrumbs_placement({}, { locale })

  if (logosSubStep === 'edit') {
    if (!hasActiveLogo) {
      return [{ label: logosLabel }]
    }
    return [{ label: logosLabel, action: onBackToList }, { label: controlsLabel }]
  }

  if (logosSubStep === 'placement') {
    return [{ label: logosLabel, action: onBackToList }, { label: placementLabel }]
  }

  return [{ label: logosLabel }]
}

export function buildTextsBreadcrumbs({
  textsSubStep,
  activeTextMeta,
  activeItemLabel,
  onBackToList,
  onBackToMultipleItems,
  locale
}: {
  textsSubStep: TextsSubStep
  activeTextMeta?: {
    value?: string | null
    label?: string | null
  } | null
  /** Label for the active placement/item when editing (only shown on 'single' substep) */
  activeItemLabel?: string | null
  onBackToList?: () => void
  /** When on 'single' with multiple items, clicking entry name goes back to multipleitems list */
  onBackToMultipleItems?: () => void
  locale?: ParaglideLocale
}): BreadcrumbItem[] {
  const textsLabel = breadcrumbs_texts({}, { locale })
  const placementLabel = breadcrumbs_placement({}, { locale })
  const numberLabel = breadcrumbs_number({}, { locale })
  const editLabel = breadcrumbs_edit({}, { locale })

  const metaValue = activeTextMeta?.value ?? ''
  const metaLabel = activeTextMeta?.label ?? ''

  // multipleitems: list of placements – only 2 levels (Texts > Entry). No item label.
  if (textsSubStep === 'multipleitems') {
    const entryLabel = metaValue?.trim() ? metaValue : numberLabel
    return [{ label: textsLabel, action: onBackToList }, { label: entryLabel }]
  }

  // single: editing one item – show 3 levels when multiple items; entry name is clickable to go back to list
  if (textsSubStep === 'single') {
    const entryLabel = metaValue?.trim() || metaLabel?.trim() || editLabel
    if (activeItemLabel?.trim() && onBackToMultipleItems) {
      return [
        { label: textsLabel, action: onBackToList },
        { label: entryLabel, action: onBackToMultipleItems },
        { label: activeItemLabel }
      ]
    }
    if (activeItemLabel?.trim()) {
      return [
        { label: textsLabel, action: onBackToList },
        { label: entryLabel },
        { label: activeItemLabel }
      ]
    }
    return [{ label: textsLabel, action: onBackToList }, { label: entryLabel }]
  }

  if (textsSubStep === 'placement') {
    return [{ label: textsLabel, action: onBackToList }, { label: placementLabel }]
  }

  return [{ label: textsLabel }]
}

export function buildColorsBreadcrumbs(locale?: ParaglideLocale): BreadcrumbItem[] {
  return [{ label: nav_color({}, { locale }) }]
}
