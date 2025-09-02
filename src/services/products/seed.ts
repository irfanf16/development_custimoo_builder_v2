import type {
  ActiveProductDetails,
  ActiveStyleDetails,
  ActiveDesignDetails,
  OutputProductDetails,
  OutputStyleDetails,
  OutputDesignDetails,
  OutputProductPreview,
  OutputStylePreview,
  OutputDesignPreview,
  ProductPreviewItem
} from '@/services/products/types'
import type {
  OutputAddon,
  OutputCompanyAddon,
  OutputRecentLogo,
  OutputProductCategories,
  Category,
  GetProductCategoriesParams,
  getProductByCategoryIdParams
} from '@/services/products/types'
import mockHttp from '@/services/mockApi'

// Minimal seed types (only what we read). The seed JSON follows products-response.ts
type SeedRoot = {
  products: {
    data: SeedProduct[]
  }
}

type SeedProduct = {
  id: number
  product_id: number
  display_name: string
  is_logo_allowed: number
  allowed_logos_count: number
  measurement_ratio: number
  sort_order: number
  using_logo_colors: number
  step_completed: number
  shareable: number
  show_3d: number
  is_3d_product: number
  is_cap_letter_available: number
  allow_fixed_logo: number
  allow_name_number: number
  company_id: number
  created_by: number
  deleted_at: string | null
  ecommerce_product_id: number | null
  factory_id: number | null
  is_default: number
  is_private: number
  parent_id: number | null
  preview_custom_texts: number
  url_slug: string
  sku_id: number
  sku: {
    addon_group_id: number | null
    asana_task_template_id: number | null
    customized_sku_info: number | null
    data_container_id: number | null
    design_customer_approval: number
    factory_id: number | null
    id: number
    image_url?: string | null
    sizechart_reference?: string | null
    sku_id: string
    sku_number: number
    specs_sheet_url?: string | null
    description?: string | null
  }
  productstyles: SeedStyle[]
  product_texts?: any[]
  logos_setting: any[]
  colors: any[]
  namefonts: any[]
  namecolors: any[]
  sizes: any[]
  company_addons?: any[]
  active_addons?: any[]
  product_addons?: any[]
  productnames?: any[]
}

type SeedStyle = {
  id: number
  product_id: number
  name: string
  back_enabled: boolean
  composition: 'multiply' | 'screen' | string
  default_style: number
  style_icon_id: number | null
  style_icon?: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  container_id: number
  style_icon_url?: string
  customized_addons: {
    grouped_addons: Record<string, any[]>
    ungrouped_addons: any[]
  }
  productdesigns: SeedDesign[]
  is_fixed_logos_all: boolean
  logo: unknown[]
  front_models: Array<{
    composition: 'multiply' | 'screen' | string
    file_url: string
    id: number
    thumb_sm_url: string
    type: string
  }>
  back_models: Array<{
    composition: 'multiply' | 'screen' | string
    file_url: string
    id: number
    thumb_sm_url: string
    type: string
  }>
  _3d_model?: any
  _3d_texture?: any
}

type SeedDesign = {
  id: number
  product_style_id: number
  product_id: number
  front_design_id: number
  container_file_id: number
  back_design_id?: number
  production_design_id: number
  frontsafezone_design_id?: number
  backsafezone_design_id?: number
  productionsafezone_design_id?: number | null
  frontboundary_design_id?: number
  backboundary_design_id?: number | null
  design_name: string
  is_active: number
  is_default: number
  svg_parts?: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  design_show: number
  design_show_on_scroll: number
  front_design: any
  back_design?: any
  frontsafezone_design?: any
  backsafezone_design?: any
  productionsafezone_design?: any
  frontboundary_design?: any
  backboundary_design?: any
  production_design: { svg_parts?: string } & any
}

type NormalizedModel = {
  composition: 'multiply' | 'screen'
  file_url: string
  id: number
  thumb_sm_url: string
  type: string
}

const CATEGORY_FILES = [
  { id: 2, file: 'hockey.json' },
  { id: 1, file: 'baseball.json' },
  { id: 3, file: 'soccer.json' }
]

type LoadedSeed = {
  categoryId: number
  file: string
  root: SeedRoot
}

export async function loadAllCategorySeeds(): Promise<LoadedSeed[]> {
  const requests = CATEGORY_FILES.map(async entry => {
    const resp = await mockHttp.get<SeedRoot>(
      `/products-by-category/${entry.file}`
    )
    return { categoryId: entry.id, file: entry.file, root: resp.data }
  })
  return await Promise.all(requests)
}

function getDefaultStyle(seedProduct: SeedProduct): SeedStyle | null {
  const styles = seedProduct.productstyles || []
  if (!styles.length) return null
  const def = styles.find(s => Number(s.default_style) === 1)
  return def || styles[0]
}

function getDefaultDesign(seedStyle: SeedStyle): SeedDesign | null {
  const designs = seedStyle.productdesigns || []
  if (!designs.length) return null
  const def = designs.find(d => Number(d.is_default) === 1)
  return def || designs[0]
}

function toOutputProductPreview(p: SeedProduct): OutputProductPreview {
  return {
    allowed_logos_count: p.allowed_logos_count ?? 0,
    colors: (p.colors as any[]) || [],
    display_name: p.display_name,
    id: p.id,
    is_logo_allowed: p.is_logo_allowed,
    measurement_ratio: p.measurement_ratio,
    product_id: p.product_id ?? p.id,
    productnames: (p.productnames as any[]) || []
  }
}

function toOutputProductDetails(p: SeedProduct): OutputProductDetails {
  const preview = toOutputProductPreview(p)
  return {
    ...preview,
    allow_fixed_logo: p.allow_fixed_logo,
    allow_name_number: p.allow_name_number,
    company_id: p.company_id,
    created_by: p.created_by,
    deleted_at: p.deleted_at,
    ecommerce_product_id: p.ecommerce_product_id,
    factory_id: p.factory_id,
    is_3d_product: p.is_3d_product,
    is_cap_letter_available: p.is_cap_letter_available,
    is_default: (p.is_default as 0 | 1) ?? 0,
    is_private: p.is_private,
    parent_id: p.parent_id,
    preview_custom_texts: p.preview_custom_texts,
    shareable: p.shareable,
    show_3d: p.show_3d,
    sku: {
      addon_group_id: p.sku.addon_group_id,
      asana_task_template_id: p.sku.asana_task_template_id,
      customized_sku_info: p.sku.customized_sku_info,
      data_container_id: p.sku.data_container_id,
      design_customer_approval: p.sku.design_customer_approval,
      factory_id: p.sku.factory_id,
      id: p.sku.id,
      image_url: p.sku.image_url ?? null,
      sizechart_reference: p.sku.sizechart_reference ?? null,
      sku_id: p.sku.sku_id,
      sku_number: p.sku.sku_number,
      specs_sheet_url: p.sku.specs_sheet_url ?? null,
      description: p.sku.description ?? null
    },
    sku_id: p.sku_id,
    sort_order: p.sort_order,
    step_completed: p.step_completed,
    svg_group_color_container: (p as any).svg_group_color_container || {},
    sync_id: (p as any).sync_id ?? null,
    url_slug: p.url_slug,
    using_logo_colors: p.using_logo_colors,
    product_addons: p.product_addons || [],
    company_addons: p.company_addons || [],
    active_addons: p.active_addons || [],
    logos_setting: p.logos_setting || []
  }
}

function toOutputStylePreview(s: SeedStyle): OutputStylePreview {
  const normalizeModels = (
    models: Array<{
      composition: 'multiply' | 'screen' | string
      file_url: string
      id: number
      thumb_sm_url: string
      type: string
    }>
  ): NormalizedModel[] =>
    models.map<NormalizedModel>(m => ({
      composition: m.composition === 'screen' ? 'screen' : 'multiply',
      file_url: m.file_url,
      id: m.id,
      thumb_sm_url: m.thumb_sm_url,
      type: m.type
    }))
  return {
    front_models: normalizeModels(s.front_models || []),
    id: s.id,
    logo: s.logo as unknown[],
    name: s.name,
    product_id: s.product_id,
    style_icon_url: s.style_icon_url
  }
}

function toOutputStyleDetails(s: SeedStyle): OutputStyleDetails {
  const normalizeModels = (
    models: Array<{
      composition: 'multiply' | 'screen' | string
      file_url: string
      id: number
      thumb_sm_url: string
      type: string
    }>
  ): NormalizedModel[] =>
    models.map<NormalizedModel>(m => ({
      composition: m.composition === 'screen' ? 'screen' : 'multiply',
      file_url: m.file_url,
      id: m.id,
      thumb_sm_url: m.thumb_sm_url,
      type: m.type
    }))
  return {
    ...toOutputStylePreview(s),
    _3d_alpha_map: (s as any)._3d_alpha_map ?? null,
    _3d_ao_map: (s as any)._3d_ao_map ?? null,
    _3d_metalness_map: (s as any)._3d_metalness_map ?? null,
    _3d_model: (s as any)._3d_model ?? {
      composition: null,
      file_url: '',
      id: 0,
      thumb_sm_url: null,
      type: ''
    },
    _3d_roughness_map: (s as any)._3d_roughness_map ?? null,
    _3d_texture: (s as any)._3d_texture ?? {
      composition: null,
      file_url: '',
      id: 0,
      thumb_sm_url: null,
      type: ''
    },
    back_enabled: s.back_enabled,
    back_models: normalizeModels(s.back_models || []),
    composition: (s.composition as 'multiply' | 'screen') ?? 'multiply',
    container_id: s.container_id,
    created_at: s.created_at,
    customized_addons: s.customized_addons as any,
    default_style: s.default_style,
    deleted_at: s.deleted_at,
    front_models: normalizeModels(s.front_models || []),
    is_default: (s as any).is_default ?? (s.default_style ? 1 : 0),
    is_fixed_logos_all: s.is_fixed_logos_all,
    logo: s.logo as unknown[],
    logo_technologies: (s as any).logo_technologies ?? [],
    metalness: (s as any).metalness ?? null,
    roughness: (s as any).roughness ?? null,
    style_icon: (s as any).style_icon ?? 0,
    style_icon_id: s.style_icon_id,
    style_icon_url: s.style_icon_url ?? '',
    updated_at: s.updated_at
  }
}

function normalizeSvgParts(design: SeedDesign): string[] {
  const raw = design.svg_parts || design.production_design?.svg_parts
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch (_e) {
    // not JSON, continue
  }
  return String(raw)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function toOutputDesignPreview(d: SeedDesign): OutputDesignPreview {
  return {
    id: d.id,
    is_default: (d.is_default as 0 | 1) ?? 0,
    front_design: d.front_design,
    frontsafezone_design: d.frontsafezone_design || {
      design_position: 'frontsafezone',
      file_url: ''
    },
    frontboundary_design: d.frontboundary_design || {
      design_position: 'frontboundary',
      file_url: ''
    },
    svg_parts: normalizeSvgParts(d)
  }
}

function toOutputDesignDetails(d: SeedDesign): OutputDesignDetails {
  return {
    ...toOutputDesignPreview(d),
    back_design: d.back_design || {
      color_group: null,
      design_name: '',
      design_position: 'back',
      file_base_url: '',
      file_extension: 'svg',
      file_thumbnail_url: '',
      file_url: '',
      id: 0
    },
    backboundary_design: d.backboundary_design || {
      design_position: 'backboundary',
      file_url: '',
      id: 0
    },
    backsafezone_design: d.backsafezone_design || {
      design_position: 'backsafezone',
      file_url: '',
      id: 0
    },
    container_file_id: d.container_file_id,
    created_at: d.created_at,
    deleted_at: d.deleted_at,
    design_name: d.design_name,
    design_show: d.design_show,
    design_show_on_scroll: d.design_show_on_scroll,
    front_design_id: d.front_design_id,
    frontsafezone_design_id: d.frontsafezone_design_id ?? undefined,
    frontboundary_design_id: d.frontboundary_design_id ?? undefined,
    backsafezone_design_id: d.backsafezone_design_id ?? undefined,
    backboundary_design_id: d.backboundary_design_id ?? undefined,
    is_active: d.is_active,
    production_design: d.production_design,
    production_design_id: d.production_design_id,
    productionsafezone_design: d.productionsafezone_design || null,
    productionsafezone_design_id: d.productionsafezone_design_id ?? null,
    product_id: d.product_id,
    product_style_id: d.product_style_id,
    updated_at: d.updated_at
  }
}

export async function buildActiveProductDetails(
  productId: number
): Promise<ActiveProductDetails | null> {
  const all = await loadAllCategorySeeds()
  for (const item of all) {
    const found = item.root.products.data.find(
      p => p.id === productId || p.product_id === productId
    )
    if (found) {
      const productDetails = toOutputProductDetails(found)
      const style = getDefaultStyle(found)
      if (!style) return null
      const styleDetails = toOutputStyleDetails(style)
      const design = getDefaultDesign(style)
      if (!design) return null
      const designDetails = toOutputDesignDetails(design)
      return { productDetails, styleDetails, designDetails }
    }
  }
  return null
}

export async function buildActiveStyleDetails(
  styleId: number
): Promise<ActiveStyleDetails | null> {
  const all = await loadAllCategorySeeds()
  for (const item of all) {
    for (const product of item.root.products.data) {
      const style = product.productstyles.find(s => s.id === styleId)
      if (style) {
        const styleDetails = toOutputStyleDetails(style)
        const design = getDefaultDesign(style)
        if (!design) return null
        const designDetails = toOutputDesignDetails(design)
        return { styleDetails, designDetails }
      }
    }
  }
  return null
}

export async function buildActiveDesignDetails(
  designId: number
): Promise<ActiveDesignDetails | null> {
  const all = await loadAllCategorySeeds()
  for (const item of all) {
    for (const product of item.root.products.data) {
      for (const style of product.productstyles) {
        const design = style.productdesigns.find(d => d.id === designId)
        if (design) {
          const designDetails = toOutputDesignDetails(design)
          return { designDetails }
        }
      }
    }
  }
  return null
}

export type ProductPreviewQuery = {
  categoryId?: number | null
  styleId?: number | null
  designId?: number | null
}

export async function buildProductPreviews(
  query: ProductPreviewQuery
): Promise<ProductPreviewItem[]> {
  const all = await loadAllCategorySeeds()

  // Helper to build preview for a concrete product/style/design trio
  const makeItem = (
    product: SeedProduct,
    style: SeedStyle,
    design: SeedDesign
  ): ProductPreviewItem => {
    const productPreview: OutputProductPreview = toOutputProductPreview(product)
    const stylePreview: OutputStylePreview = toOutputStylePreview(style)
    const designPreview: OutputDesignPreview = toOutputDesignPreview(design)
    return { productPreview, stylePreview, designPreview }
  }

  // If designId provided, find exact trio
  if (query.designId) {
    for (const c of all) {
      for (const product of c.root.products.data) {
        for (const style of product.productstyles) {
          const design = style.productdesigns.find(d => d.id === query.designId)
          if (design) return [makeItem(product, style, design)]
        }
      }
    }
    return []
  }

  // If styleId provided, find style and its default design
  if (query.styleId) {
    for (const c of all) {
      for (const product of c.root.products.data) {
        const style = product.productstyles.find(s => s.id === query.styleId)
        if (style) {
          const design = getDefaultDesign(style)
          if (!design) return []
          return [makeItem(product, style, design)]
        }
      }
    }
    return []
  }

  // Category-based or all previews
  const results: ProductPreviewItem[] = []
  const categoryIds = query.categoryId
    ? [query.categoryId]
    : all.map(s => s.categoryId)
  for (const c of all) {
    if (!categoryIds.includes(c.categoryId)) continue
    for (const product of c.root.products.data) {
      const style = getDefaultStyle(product)
      if (!style) continue
      const design = getDefaultDesign(style)
      if (!design) continue
      results.push(makeItem(product, style, design))
    }
  }
  return results
}

export async function buildDesignPreviewsByStyleId(
  styleId: number
): Promise<OutputDesignPreview[]> {
  const all = await loadAllCategorySeeds()
  for (const item of all) {
    for (const product of item.root.products.data) {
      const style = product.productstyles.find(s => s.id === styleId)
      if (style) return style.productdesigns.map(toOutputDesignPreview)
    }
  }
  return []
}

export async function buildStylePreviewsByProduct(
  productId: number
): Promise<OutputStylePreview[]> {
  const all = await loadAllCategorySeeds()
  for (const item of all) {
    const product = item.root.products.data.find(
      p => p.id === productId || p.product_id === productId
    )
    if (product) return product.productstyles.map(toOutputStylePreview)
  }
  return []
}

export async function buildProductAddonsBundle(productId: number): Promise<{
  active_addons: OutputAddon[]
  product_addons: OutputAddon[]
  company_addons: OutputCompanyAddon[]
}> {
  const all = await loadAllCategorySeeds()
  for (const item of all) {
    const product = item.root.products.data.find(
      p => p.id === productId || p.product_id === productId
    )
    if (product) {
      return {
        active_addons:
          (product.active_addons as unknown as OutputAddon[]) || [],
        product_addons:
          (product.product_addons as unknown as OutputAddon[]) || [],
        company_addons:
          (product.company_addons as unknown as OutputCompanyAddon[]) || []
      }
    }
  }
  return { active_addons: [], product_addons: [], company_addons: [] }
}

export async function buildRecentLogos(
  _companyId?: number
): Promise<OutputRecentLogo[]> {
  // Not present in seed; return empty list for now
  return []
}

export async function buildProductCategories(
  _params?: GetProductCategoriesParams
): Promise<OutputProductCategories> {
  const loaded = await loadAllCategorySeeds()
  const categories: Category[] = loaded.map((entry, idx) => {
    const base = entry.file.replace('.json', '')
    const name = base.charAt(0).toUpperCase() + base.slice(1)
    return {
      category_name: name,
      company_id: 0,
      created_at: new Date().toISOString(),
      deleted_at: null,
      factory_id: null,
      id: entry.categoryId,
      image_url: null,
      parent_id: null,
      searchable: 1,
      sort_order: idx + 1,
      subcategories: [],
      updated_at: new Date().toISOString()
    }
  })
  const totalProducts = loaded.reduce(
    (sum, s) => sum + (s.root.products?.data?.length || 0),
    0
  )
  return {
    customized: true,
    customized_count: totalProducts,
    data: categories,
    no_product_found: categories.length === 0,
    no_search_product_found: false,
    personalized: false,
    personalized_count: 0,
    private_product: false,
    private_product_count: 0,
    product_category_id: null,
    product_sub_category_id: null
  }
}

export async function buildProductsByCategoryId(
  params: getProductByCategoryIdParams
): Promise<OutputProductCategories> {
  const base = await buildProductCategories()
  return { ...base, product_category_id: params.category_id }
}
