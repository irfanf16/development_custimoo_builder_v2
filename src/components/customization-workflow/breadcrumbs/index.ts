import type { BreadcrumbItem } from '../types'
import type {
  LogosSubStep,
  ProductsSubStep,
  TextsSubStep
} from '@/stores/workflow/workflow.store.types'
import type { Category } from '@/services/products/types/categories'

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
  onSubCategoryStep
}: ProductBreadcrumbParams): BreadcrumbItem[] {
  if (!hasCategories) {
    return [{ label: 'Select Product' }]
  }

  if (productsSubStep === 'category') {
    return [{ label: 'Category' }]
  }

  const categoryId = selectedCategoryId ?? activeCategoryId ?? null
  const subCategoryId = selectedSubCategoryId ?? activeSubCategoryId ?? null

  const category = categories?.find(cat => cat.id === categoryId) ?? null
  const hasSubcategories = !!(category && category.subcategories && category.subcategories.length)

  if (productsSubStep === 'subcategory') {
    return [
      { label: 'Category', action: onCategoryStep },
      { label: category?.category_name || '—' }
    ]
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Category', action: onCategoryStep }]

  const categoryLabel = category?.category_name || '—'
  if (categoryLabel) {
    breadcrumbs.push({
      label: categoryLabel,
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

export function buildDesignBreadcrumbs(): BreadcrumbItem[] {
  return [{ label: 'Designs' }]
}

export function buildLogoBreadcrumbs({
  logosSubStep,
  hasActiveLogo,
  onBackToList
}: {
  logosSubStep: LogosSubStep
  hasActiveLogo: boolean
  onBackToList?: () => void
}): BreadcrumbItem[] {
  if (logosSubStep === 'edit') {
    if (!hasActiveLogo) {
      return [{ label: 'Logos' }]
    }
    return [{ label: 'Logos', action: onBackToList }, { label: 'Controls' }]
  }

  if (logosSubStep === 'placement') {
    return [{ label: 'Logos', action: onBackToList }, { label: 'Placement' }]
  }

  return [{ label: 'Logos' }]
}

export function buildTextsBreadcrumbs({
  textsSubStep,
  activeTextMeta,
  onBackToList
}: {
  textsSubStep: TextsSubStep
  activeTextMeta?: {
    value?: string | null
    label?: string | null
  } | null
  onBackToList?: () => void
}): BreadcrumbItem[] {
  const metaValue = activeTextMeta?.value ?? ''
  const metaLabel = activeTextMeta?.label ?? ''

  if (textsSubStep === 'number-font') {
    const label = metaValue?.trim() ? metaValue : 'Number'
    return [{ label: 'Texts', action: onBackToList }, { label }]
  }

  if (textsSubStep === 'edit') {
    const label = metaValue?.trim() || metaLabel?.trim() || 'Edit'
    return [{ label: 'Texts', action: onBackToList }, { label }]
  }

  if (textsSubStep === 'placement') {
    return [{ label: 'Texts', action: onBackToList }, { label: 'Placement' }]
  }

  return [{ label: 'Texts' }]
}

export function buildColorsBreadcrumbs(): BreadcrumbItem[] {
  return [{ label: 'Color' }]
}
