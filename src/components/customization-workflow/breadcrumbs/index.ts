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
  onBackToList,
  locale
}: {
  textsSubStep: TextsSubStep
  activeTextMeta?: {
    value?: string | null
    label?: string | null
  } | null
  onBackToList?: () => void
  locale?: ParaglideLocale
}): BreadcrumbItem[] {
  const textsLabel = breadcrumbs_texts({}, { locale })
  const placementLabel = breadcrumbs_placement({}, { locale })
  const numberLabel = breadcrumbs_number({}, { locale })
  const editLabel = breadcrumbs_edit({}, { locale })

  const metaValue = activeTextMeta?.value ?? ''
  const metaLabel = activeTextMeta?.label ?? ''

  if (textsSubStep === 'number-font') {
    const label = metaValue?.trim() ? metaValue : numberLabel
    return [{ label: textsLabel, action: onBackToList }, { label }]
  }

  if (textsSubStep === 'edit') {
    const label = metaValue?.trim() || metaLabel?.trim() || editLabel
    return [{ label: textsLabel, action: onBackToList }, { label }]
  }

  if (textsSubStep === 'placement') {
    return [{ label: textsLabel, action: onBackToList }, { label: placementLabel }]
  }

  return [{ label: textsLabel }]
}

export function buildColorsBreadcrumbs(locale?: ParaglideLocale): BreadcrumbItem[] {
  return [{ label: nav_color({}, { locale }) }]
}
