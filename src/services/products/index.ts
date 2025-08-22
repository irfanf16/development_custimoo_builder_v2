import http from '../api'
import type { AxiosResponse } from 'axios'
import type {
  OutputProductCategories,
  GetProductCategoriesParams,
  getProductByCategoryIdParams,
  ActiveProductDetails,
  ProductPreviewItem
} from '@/services/products/types'

async function getProductCategories(params: GetProductCategoriesParams) {
  return await http.get<OutputProductCategories>('product/categories', {
    params
  })
}

async function getProductByCategoryId(params: getProductByCategoryIdParams) {
  return await http.get<OutputProductCategories>(`list/products`, { params })
}

// Mock or real endpoint to fetch full details for the active product
async function getActiveProductDetails(productId: number) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const mock: ActiveProductDetails = {
      product: {
        allowed_logos_count: 0,
        colors: [],
        display_name: '2000-series hockey jersey',
        id: 146,
        is_logo_allowed: 1,
        logos_setting: [],
        measurement_ratio: 0.1458,
        product_id: 146,
        productnames: [],
        allow_fixed_logo: 0,
        allow_name_number: 1,
        company_id: 6,
        created_by: 19,
        deleted_at: null,
        ecommerce_product_id: null,
        factory_id: null,
        is_3d_product: 0,
        is_cap_letter_available: 0,
        is_default: 0,
        is_private: 0,
        parent_id: null,
        preview_custom_texts: 1,
        shareable: 0,
        show_3d: 0,
        sku: {
          addon_group_id: null,
          asana_task_template_id: null,
          customized_sku_info: null,
          data_container_id: null,
          design_customer_approval: 1,
          factory_id: null,
          id: 163,
          image_url:
            'files/sku/11_Hockey+Jersey+Unisex+-+Sizechart+Custimoo1676042133.jpg',
          sizechart_reference: 'Hockey jerseys',
          sku_id: '2000-series hockey jersey',
          sku_number: 1072,
          specs_sheet_url: null
        },
        sku_id: 163,
        sort_order: 1,
        step_completed: 3,
        svg_group_color_container: {},
        sync_id: null,
        url_slug: 'ninja_2000_hockey_jersey',
        using_logo_colors: 0
      },
      productstyle: {
        _3d_alpha_map: null,
        _3d_ao_map: null,
        _3d_metalness_map: null,
        _3d_model: {
          composition: null,
          file_url: '',
          id: 0,
          thumb_sm_url: null,
          type: ''
        },
        _3d_roughness_map: null,
        _3d_texture: {
          composition: null,
          file_url: '',
          id: 0,
          thumb_sm_url: null,
          type: ''
        },
        back_enabled: true,
        back_models: [
          {
            composition: 'screen',
            file_url:
              'super_admin/files/product/base_model/2000_all_back_highlights-65e72eb286940.png',
            id: 818,
            thumb_sm_url:
              'super_admin/files/product/base_model/2000_all_back_highlights_150-65e72eb286940.png',
            type: '2d_detail_layer'
          },
          {
            composition: 'multiply',
            file_url:
              'super_admin/files/product/base_model/2000_all_back_shadows-65e72ec04271b.png',
            id: 820,
            thumb_sm_url:
              'super_admin/files/product/base_model/2000_all_back_shadows_150-65e72ec04271b.png',
            type: '2d_detail_layer'
          }
        ],
        composition: 'multiply',
        container_id: 127,
        created_at: '2022-09-27T11:51:31.000000Z',
        customized_addons: { grouped_addons: {}, ungrouped_addons: [] },
        default_style: 1,
        deleted_at: null,
        front_models: [
          {
            composition: 'screen',
            file_url:
              'super_admin/files/product/base_model/2000_elastic_front_highlights-65e72edac5175.png',
            id: 848,
            thumb_sm_url:
              'super_admin/files/product/base_model/2000_elastic_front_highlights_150-65e72edac5175.png',
            type: '2d_detail_layer'
          },
          {
            composition: 'multiply',
            file_url:
              'super_admin/files/product/base_model/2000_elastic_front_Shadows-65e72edee7c3c.png',
            id: 849,
            thumb_sm_url:
              'super_admin/files/product/base_model/2000_elastic_front_Shadows_150-65e72edee7c3c.png',
            type: '2d_detail_layer'
          }
        ],
        id: 211,
        is_default: 0,
        is_fixed_logos_all: true,
        logo: [],
        logo_technologies: [],
        metalness: null,
        name: 'V-neck',
        product_id: 146,
        roughness: null,
        style_icon: 787,
        style_icon_id: null,
        style_icon_url: 'factory_10/files/10/product/style_icon/V-neck2.png',
        updated_at: '2023-12-07T11:50:01.000000Z'
      },
      productdesign: {
        id: 56073,
        is_default: 1,
        back_design: {
          color_group: null,
          design_name: 'Alberta',
          design_position: 'back',
          file_base_url:
            'super_admin/files/container/307/307/Alberta/1755592473-back.svg',
          file_extension: 'svg',
          file_thumbnail_url:
            'super_admin/files/container/307/307/Alberta/1755592473-back.svg',
          file_url:
            'super_admin/files/container/307/307/Alberta/1755592473-back',
          id: 129633
        },
        backboundary_design: {
          design_position: 'backboundary',
          file_base_url:
            'super_admin/files/container/307/307/Alberta/1755592473-backboundary.svg',
          file_extension: 'svg',
          file_thumbnail_url:
            'super_admin/files/container/307/307/Alberta/1755592473-backboundary.svg',
          file_url:
            'super_admin/files/container/307/307/Alberta/1755592473-backboundary.svg',
          id: 129638
        },
        backsafezone_design: {
          design_position: 'backsafezone',
          file_base_url:
            'super_admin/files/container/307/307/Alberta/1755592473-BackSafeZones.svg',
          file_extension: 'svg',
          file_thumbnail_url:
            'super_admin/files/container/307/307/Alberta/1755592473-BackSafeZones.svg',
          file_url:
            'super_admin/files/container/307/307/Alberta/1755592473-BackSafeZones.svg',
          id: 129636
        },
        container_file_id: 307,
        created_at: '2024-11-28T11:54:15.000000Z',
        deleted_at: null,
        design_name: 'Alberta',
        design_show: 0,
        design_show_on_scroll: 1,
        frontsafezone_design: {
          design_position: 'frontsafezone',
          file_base_url:
            'super_admin/files/container/307/307/Alberta/1755592473-FrontSafeZones.svg',
          file_extension: 'svg',
          file_thumbnail_url:
            'super_admin/files/container/307/307/Alberta/1755592473-FrontSafeZones.svg',
          file_url:
            'super_admin/files/container/307/307/Alberta/1755592473-FrontSafeZones.svg',
          id: 129635
        },
        frontboundary_design: {
          design_position: 'frontboundary',
          file_base_url:
            'super_admin/files/container/307/307/Alberta/1755592473-frontboundary.svg',
          file_extension: 'svg',
          file_thumbnail_url:
            'super_admin/files/container/307/307/Alberta/1755592473-frontboundary.svg',
          file_url:
            'super_admin/files/container/307/307/Alberta/1755592473-frontboundary.svg',
          id: 129637
        },
        front_design: {
          color_group: null,
          design_name: 'Alberta',
          design_position: 'front',
          file_base_url:
            'super_admin/files/container/307/307/Alberta/1755592473-front.svg',
          file_extension: 'svg',
          file_thumbnail_url:
            'super_admin/files/container/307/307/Alberta/1755592473-front.svg',
          file_url:
            'super_admin/files/container/307/307/Alberta/1755592473-front',
          id: 129632
        },
        front_design_id: 129632,
        is_active: 1,
        production_design: {
          design_position: 'production',
          file_base_url:
            'super_admin/files/container/307/307/Alberta/1755592473-production.svg',
          file_extension: 'svg',
          file_thumbnail_url:
            'super_admin/files/container/307/307/Alberta/1755592473-production.svg',
          file_url:
            'super_admin/files/container/307/307/Alberta/1755592473-production',
          id: 129634
        },
        production_design_id: 129634,
        productionsafezone_design: {
          design_position: 'productionsafezone',
          file_base_url:
            'super_admin/files/container/307/307/Alberta/1755592473-ProductionSafeZones.svg',
          file_extension: 'svg',
          file_thumbnail_url:
            'super_admin/files/container/307/307/Alberta/1755592473-ProductionSafeZones.svg',
          file_url:
            'super_admin/files/container/307/307/Alberta/1755592473-ProductionSafeZones.svg',
          id: 129639
        },
        productionsafezone_design_id: 129639,
        product_id: 146,
        product_style_id: 211,
        updated_at: '2025-08-06T09:25:29.000000Z',
        svg_parts: ['base', 'sleeves', 'shoulder']
      }
    }
    return Promise.resolve({
      status: 200,
      data: mock
    } as AxiosResponse<ActiveProductDetails>)
  }
  return await http.get<ActiveProductDetails>(`list/active-product-details`, {
    params: { product_id: productId }
  })
}

// Mock or real endpoint to fetch lightweight previews for all products in a category
async function getProductPreviewsByCategory(categoryId: number | null) {
  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
  if (useMocks) {
    const mock: ProductPreviewItem[] = [
      {
        product: {
          allowed_logos_count: 0,
          colors: [],
          display_name: '2000-series hockey jersey',
          id: 146,
          is_logo_allowed: 1,
          logos_setting: [],
          measurement_ratio: 0.1458,
          product_id: 146,
          productnames: []
        },
        defaultStyle: {
          front_models: [
            {
              composition: 'screen',
              file_url:
                'super_admin/files/product/base_model/2000_elastic_front_highlights-65e72edac5175.png',
              id: 848,
              thumb_sm_url:
                'super_admin/files/product/base_model/2000_elastic_front_highlights_150-65e72edac5175.png',
              type: '2d_detail_layer'
            },
            {
              composition: 'multiply',
              file_url:
                'super_admin/files/product/base_model/2000_elastic_front_Shadows-65e72edee7c3c.png',
              id: 849,
              thumb_sm_url:
                'super_admin/files/product/base_model/2000_elastic_front_Shadows_150-65e72edee7c3c.png',
              type: '2d_detail_layer'
            }
          ],
          id: 211,
          logo: [],
          name: 'V-neck',
          product_id: 146
        },
        defaultDesign: {
          id: 56073,
          is_default: 1,
          front_design: {
            color_group: null,
            design_name: 'Alberta',
            design_position: 'front',
            file_base_url:
              'super_admin/files/container/307/307/Alberta/1755592473-front.svg',
            file_extension: 'svg',
            file_thumbnail_url:
              'super_admin/files/container/307/307/Alberta/1755592473-front.svg',
            file_url:
              'super_admin/files/container/307/307/Alberta/1755592473-front',
            id: 129632
          },
          frontsafezone_design: {
            design_position: 'frontsafezone',
            file_base_url:
              'super_admin/files/container/307/307/Alberta/1755592473-FrontSafeZones.svg',
            file_extension: 'svg',
            file_thumbnail_url:
              'super_admin/files/container/307/307/Alberta/1755592473-FrontSafeZones.svg',
            file_url:
              'super_admin/files/container/307/307/Alberta/1755592473-FrontSafeZones.svg',
            id: 129635
          },
          frontboundary_design: {
            design_position: 'frontboundary',
            file_base_url:
              'super_admin/files/container/307/307/Alberta/1755592473-frontboundary.svg',
            file_extension: 'svg',
            file_thumbnail_url:
              'super_admin/files/container/307/307/Alberta/1755592473-frontboundary.svg',
            file_url:
              'super_admin/files/container/307/307/Alberta/1755592473-frontboundary.svg',
            id: 129637
          },
          svg_parts: ['base', 'sleeves', 'shoulder']
        }
      }
    ]
    return Promise.resolve({ status: 200, data: mock } as AxiosResponse<
      ProductPreviewItem[]
    >)
  }
  return await http.get<ProductPreviewItem[]>(`list/product-previews`, {
    params: { category_id: categoryId }
  })
}

export default {
  getProductCategories,
  getProductByCategoryId,
  getActiveProductDetails,
  getProductPreviewsByCategory
}
