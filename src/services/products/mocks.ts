import type { AxiosResponse } from 'axios'
import type {
  ActiveProductDetails,
  ProductPreviewItem,
  OutputStylePreview,
  OutputDesignDetails,
  OutputRecentLogo
} from '@/services/products/types'

export const mockActiveProductDetails: ActiveProductDetails = {
  productDetails: {
    allowed_logos_count: 0,
    colors: [],
    display_name: '2000-series hockey jersey',
    id: 146,
    is_logo_allowed: 1,
    logos_setting: [
      {
        id: 3751,
        product_id: 146,
        product_style_id: null,
        logos_follows_product: 0,
        following_product_ids: null,
        x_axis: 300,
        y_axis: 300,
        rotation: 0,
        width: 0,
        height: 180,
        name_of_placement: 'Team Logo',
        side: 'front',
        is_locked: 0,
        logo_technologies: null,
        created_at: '2024-07-30T10:30:53.000000Z',
        updated_at: '2024-07-30T10:30:53.000000Z'
      },
      {
        id: 3752,
        product_id: 146,
        product_style_id: null,
        logos_follows_product: 0,
        following_product_ids: null,
        x_axis: 300,
        y_axis: 450,
        rotation: 0,
        width: 0,
        height: 90,
        name_of_placement: 'Logo 1',
        side: 'front',
        is_locked: 0,
        logo_technologies: null,
        created_at: '2024-07-30T10:30:53.000000Z',
        updated_at: '2024-07-30T10:30:53.000000Z'
      },
      {
        id: 3753,
        product_id: 146,
        product_style_id: null,
        logos_follows_product: 0,
        following_product_ids: null,
        x_axis: 300,
        y_axis: 450,
        rotation: 0,
        width: 0,
        height: 90,
        name_of_placement: 'Logo 2',
        side: 'back',
        is_locked: 0,
        logo_technologies: null,
        created_at: '2024-07-30T10:30:53.000000Z',
        updated_at: '2024-07-30T10:30:53.000000Z'
      },
      {
        id: 3754,
        product_id: 146,
        product_style_id: null,
        logos_follows_product: 0,
        following_product_ids: null,
        x_axis: 220,
        y_axis: 130,
        rotation: 0,
        width: 0,
        height: 60,
        name_of_placement: 'Logo 3',
        side: 'front',
        is_locked: 0,
        logo_technologies: null,
        created_at: '2024-07-30T10:30:53.000000Z',
        updated_at: '2024-07-30T10:30:53.000000Z'
      },
      {
        id: 3755,
        product_id: 146,
        product_style_id: null,
        logos_follows_product: 0,
        following_product_ids: null,
        x_axis: 380,
        y_axis: 130,
        rotation: 0,
        width: 0,
        height: 60,
        name_of_placement: 'Logo 4',
        side: 'front',
        is_locked: 0,
        logo_technologies: null,
        created_at: '2024-07-30T10:30:53.000000Z',
        updated_at: '2024-07-30T10:30:53.000000Z'
      },
      {
        id: 3756,
        product_id: 146,
        product_style_id: null,
        logos_follows_product: 0,
        following_product_ids: null,
        x_axis: 300,
        y_axis: 50,
        rotation: 0,
        width: 0,
        height: 50,
        name_of_placement: 'Logo 5',
        side: 'back',
        is_locked: 0,
        logo_technologies: null,
        created_at: '2024-07-30T10:30:53.000000Z',
        updated_at: '2024-07-30T10:30:53.000000Z'
      }
    ],
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
      specs_sheet_url: null,
      description:
        '<p>Our most popular and <strong>best value <\/strong>jersey model!<\/p><p>Fully sublimated - unlimited design possibilities<\/p><p>Standard weight (220 g\/m2 textile)<\/p><p>5 different collars to choose from.<\/p>'
    },
    sku_id: 163,
    sort_order: 1,
    step_completed: 3,
    svg_group_color_container: {},
    sync_id: null,
    url_slug: 'ninja_2000_hockey_jersey',
    using_logo_colors: 0,
    product_addons: [
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 313,
        title: 'Fight strap',
        description: '<p>Fight strap<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 3
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 314,
        title: 'Sublimated name patch',
        description: '<p>Sublimated velcro name patch<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 6
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 315,
        title: 'Sublimated velcro name patch',
        description: '<p>Sublimated velcro name patch<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 6
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 316,
        title: 'Sublimated sponsor patches',
        description: '<p>Sublimated sponsor patches<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 4
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 317,
        title: 'Sublimated logo patch',
        description: '<p>Sublimated logo patch<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 4
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 319,
        title: 'Tackle twill nameplates',
        description: '<p>Tackle twill nameplates<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 11.29
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 320,
        title: 'Double shoulders',
        description: '<p>Double shoulders<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 2
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 321,
        title: 'Double elbows',
        description: '<p>Double elbows<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 2
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      }
    ],
    company_addons: [
      {
        id: 17,
        company_id: 6,
        addon_id: 313,
        addon_sync_id: null,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null,
        addon_data: {
          note: null,
          title: 'Fight strap',
          currencies: [
            {
              code: 'DKK',
              name: 'Danish Krone',
              price: 0,
              symbol: 'Kr.'
            },
            {
              code: 'SEK',
              name: 'Swedish Krona',
              price: 0,
              symbol: 'kr'
            },
            {
              code: 'GBP',
              name: 'Pound Sterling',
              price: 0,
              symbol: '\u00a3'
            },
            {
              code: 'EUR',
              name: 'Euro',
              price: 0,
              symbol: '\u20ac'
            },
            {
              code: 'CAD',
              name: 'Canadian Dollar',
              price: 3.99,
              symbol: 'C$'
            },
            {
              code: 'USD',
              name: 'United States Dollar',
              price: 5,
              symbol: '$'
            }
          ],
          description: '<p>Fight strap<\/p>'
        },
        created_at: '2023-11-22T08:44:39.000000Z',
        updated_at: '2023-11-24T10:13:05.000000Z',
        deleted_at: null
      },
      {
        id: 222,
        company_id: 6,
        addon_id: 314,
        addon_sync_id: null,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null,
        addon_data: {
          note: null,
          title: 'Sublimated name patch',
          currencies: [
            {
              code: 'DKK',
              name: 'Danish Krone',
              price: 0,
              symbol: 'Kr.'
            },
            {
              code: 'SEK',
              name: 'Swedish Krona',
              price: 0,
              symbol: 'kr'
            },
            {
              code: 'GBP',
              name: 'Pound Sterling',
              price: 0,
              symbol: '\u00a3'
            },
            {
              code: 'EUR',
              name: 'Euro',
              price: 0,
              symbol: '\u20ac'
            },
            {
              code: 'CAD',
              name: 'Canadian Dollar',
              price: 4.66,
              symbol: 'C$'
            },
            {
              code: 'USD',
              name: 'United States Dollar',
              price: 3.5,
              symbol: '$'
            }
          ],
          description: '<p>Sublimated velcro name patch<\/p>'
        },
        created_at: '2023-11-24T09:13:32.000000Z',
        updated_at: '2023-11-24T10:13:05.000000Z',
        deleted_at: null
      },
      {
        id: 223,
        company_id: 6,
        addon_id: 315,
        addon_sync_id: null,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null,
        addon_data: {
          note: null,
          title: 'Sublimated velcro name patch',
          currencies: [
            {
              code: 'DKK',
              name: 'Danish Krone',
              price: 0,
              symbol: 'Kr.'
            },
            {
              code: 'SEK',
              name: 'Swedish Krona',
              price: 0,
              symbol: 'kr'
            },
            {
              code: 'GBP',
              name: 'Pound Sterling',
              price: 0,
              symbol: '\u00a3'
            },
            {
              code: 'EUR',
              name: 'Euro',
              price: 0,
              symbol: '\u20ac'
            },
            {
              code: 'CAD',
              name: 'Canadian Dollar',
              price: 6.65,
              symbol: 'C$'
            },
            {
              code: 'USD',
              name: 'United States Dollar',
              price: 5,
              symbol: '$'
            }
          ],
          description: '<p>Sublimated velcro name patch<\/p>'
        },
        created_at: '2023-11-24T09:13:32.000000Z',
        updated_at: '2023-11-24T10:13:05.000000Z',
        deleted_at: null
      },
      {
        id: 224,
        company_id: 6,
        addon_id: 316,
        addon_sync_id: null,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null,
        addon_data: {
          note: null,
          title: 'Sublimated sponsor patches',
          currencies: [
            {
              code: 'DKK',
              name: 'Danish Krone',
              price: 0,
              symbol: 'Kr.'
            },
            {
              code: 'SEK',
              name: 'Swedish Krona',
              price: 0,
              symbol: 'kr'
            },
            {
              code: 'GBP',
              name: 'Pound Sterling',
              price: 0,
              symbol: '\u00a3'
            },
            {
              code: 'EUR',
              name: 'Euro',
              price: 0,
              symbol: '\u20ac'
            },
            {
              code: 'CAD',
              name: 'Canadian Dollar',
              price: 5.32,
              symbol: 'C$'
            },
            {
              code: 'USD',
              name: 'United States Dollar',
              price: 4,
              symbol: '$'
            }
          ],
          description: '<p>Sublimated sponsor patches<\/p>'
        },
        created_at: '2023-11-24T09:13:32.000000Z',
        updated_at: '2023-11-24T10:13:05.000000Z',
        deleted_at: null
      },
      {
        id: 225,
        company_id: 6,
        addon_id: 317,
        addon_sync_id: null,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null,
        addon_data: {
          note: null,
          title: 'Sublimated logo patch',
          currencies: [
            {
              code: 'DKK',
              name: 'Danish Krone',
              price: 0,
              symbol: 'Kr.'
            },
            {
              code: 'SEK',
              name: 'Swedish Krona',
              price: 0,
              symbol: 'kr'
            },
            {
              code: 'GBP',
              name: 'Pound Sterling',
              price: 0,
              symbol: '\u00a3'
            },
            {
              code: 'EUR',
              name: 'Euro',
              price: 0,
              symbol: '\u20ac'
            },
            {
              code: 'CAD',
              name: 'Canadian Dollar',
              price: 5.32,
              symbol: 'C$'
            },
            {
              code: 'USD',
              name: 'United States Dollar',
              price: 4,
              symbol: '$'
            }
          ],
          description: '<p>Sublimated logo patch<\/p>'
        },
        created_at: '2023-11-24T09:13:32.000000Z',
        updated_at: '2023-11-24T10:13:05.000000Z',
        deleted_at: null
      },
      {
        id: 292,
        company_id: 6,
        addon_id: 319,
        addon_sync_id: null,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null,
        addon_data: {
          note: null,
          title: 'Tackle twill nameplates',
          currencies: [
            {
              code: 'DKK',
              name: 'Danish Krone',
              price: 47,
              symbol: 'Kr.'
            },
            {
              code: 'SEK',
              name: 'Swedish Krona',
              price: 0,
              symbol: 'kr'
            },
            {
              code: 'GBP',
              name: 'Pound Sterling',
              price: 0,
              symbol: '\u00a3'
            },
            {
              code: 'EUR',
              name: 'Euro',
              price: 0,
              symbol: '\u20ac'
            },
            {
              code: 'CAD',
              name: 'Canadian Dollar',
              price: 9.12,
              symbol: 'C$'
            },
            {
              code: 'USD',
              name: 'United States Dollar',
              price: 6.75,
              symbol: '$'
            }
          ],
          description: '<p>Tackle twill nameplates<\/p>'
        },
        created_at: '2023-11-24T09:16:26.000000Z',
        updated_at: '2023-11-24T10:13:05.000000Z',
        deleted_at: null
      },
      {
        id: 380,
        company_id: 6,
        addon_id: 320,
        addon_sync_id: null,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null,
        addon_data: {
          note: null,
          title: 'Double shoulders',
          currencies: [
            {
              code: 'DKK',
              name: 'Danish Krone',
              price: 30,
              symbol: 'Kr.'
            },
            {
              code: 'SEK',
              name: 'Swedish Krona',
              price: 0,
              symbol: 'kr'
            },
            {
              code: 'GBP',
              name: 'Pound Sterling',
              price: 0,
              symbol: '\u00a3'
            },
            {
              code: 'EUR',
              name: 'Euro',
              price: 0,
              symbol: '\u20ac'
            },
            {
              code: 'CAD',
              name: 'Canadian Dollar',
              price: 5.4,
              symbol: 'C$'
            },
            {
              code: 'USD',
              name: 'United States Dollar',
              price: 4,
              symbol: '$'
            }
          ],
          description: '<p>Double shoulders<\/p>'
        },
        created_at: '2023-11-24T09:21:03.000000Z',
        updated_at: '2023-11-24T10:13:05.000000Z',
        deleted_at: null
      },
      {
        id: 381,
        company_id: 6,
        addon_id: 321,
        addon_sync_id: null,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null,
        addon_data: {
          note: null,
          title: 'Double elbows',
          currencies: [
            {
              code: 'DKK',
              name: 'Danish Krone',
              price: 15,
              symbol: 'Kr.'
            },
            {
              code: 'SEK',
              name: 'Swedish Krona',
              price: 0,
              symbol: 'kr'
            },
            {
              code: 'GBP',
              name: 'Pound Sterling',
              price: 0,
              symbol: '\u00a3'
            },
            {
              code: 'EUR',
              name: 'Euro',
              price: 0,
              symbol: '\u20ac'
            },
            {
              code: 'CAD',
              name: 'Canadian Dollar',
              price: 2.7,
              symbol: 'C$'
            },
            {
              code: 'USD',
              name: 'United States Dollar',
              price: 2,
              symbol: '$'
            }
          ],
          description: '<p>Double elbows<\/p>'
        },
        created_at: '2023-11-24T09:21:03.000000Z',
        updated_at: '2023-11-24T10:13:05.000000Z',
        deleted_at: null
      }
    ],
    active_addons: [
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 313,
        title: 'Fight strap',
        description: '<p>Fight strap<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 3
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 314,
        title: 'Sublimated name patch',
        description: '<p>Sublimated velcro name patch<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 6
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 315,
        title: 'Sublimated velcro name patch',
        description: '<p>Sublimated velcro name patch<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 6
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 316,
        title: 'Sublimated sponsor patches',
        description: '<p>Sublimated sponsor patches<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 4
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 317,
        title: 'Sublimated logo patch',
        description: '<p>Sublimated logo patch<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 4
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 319,
        title: 'Tackle twill nameplates',
        description: '<p>Tackle twill nameplates<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 11.29
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 320,
        title: 'Double shoulders',
        description: '<p>Double shoulders<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 2
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      },
      {
        addon_group_id: null,
        data_container_id: null,
        customized_sku_info: null,
        addon_id: 321,
        title: 'Double elbows',
        description: '<p>Double elbows<\/p>',
        note: null,
        currencies: [
          {
            name: 'United States Dollar',
            code: 'USD',
            symbol: '$',
            price: 2
          }
        ],
        selected: false,
        published: true,
        addon_ecommerce_product_id: null,
        addon_ecommerce_variant_id: null,
        addon_ecommerce_modifier_id: null
      }
    ]
  },
  styleDetails: {
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
  designDetails: {
    id: 41953,
    product_style_id: 211,
    product_id: 146,
    front_design_id: 53606,
    container_file_id: 307,
    back_design_id: 53607,
    production_design_id: 53608,
    frontsafezone_design_id: 53609,
    backsafezone_design_id: 126261,
    productionsafezone_design_id: null,
    frontboundary_design_id: 85537,
    backboundary_design_id: 126289,
    design_name: 'skargarden',
    is_active: 1,
    is_default: 1,
    svg_parts: [
      'base',
      'shoulders',
      'collar-1',
      'v',
      'collar-2',
      'stripe-1',
      'stripe-2',
      'stripe-3',
      'sleeve-detail',
      'cuffs',
      'diamond',
      'shoulder-stripe'
    ],
    created_at: '2023-10-03T13:24:59.000000Z',
    updated_at: '2025-06-30T10:04:01.000000Z',
    deleted_at: null,
    design_show: 1,
    design_show_on_scroll: 0,
    front_design: {
      id: 53606,
      design_name: 'skargarden',
      design_position: 'front',
      color_group: '{}',
      file_url:
        'super_admin/files/container/307/307/skargarden/1752317264-Front.svg',
      file_extension: 'svg',
      file_base_url:
        'super_admin/files/container/307/307/skargarden/1752317264-Front.svg',
      file_thumbnail_url:
        'super_admin/files/container/307/307/skargarden/1752317264-Front.svg'
    },
    back_design: {
      id: 53607,
      design_name: 'skargarden',
      design_position: 'back',
      color_group: '{}',
      file_url:
        'super_admin/files/container/307/307/skargarden/1752317264-Back.svg',
      file_extension: 'svg',
      file_base_url:
        'super_admin/files/container/307/307/skargarden/1752317264-Back.svg',
      file_thumbnail_url:
        'super_admin/files/container/307/307/skargarden/1752317264-Back.svg'
    },
    frontsafezone_design: {
      id: 53609,
      design_position: 'frontsafezone',
      file_url:
        'super_admin/files/container/307/307/skargarden/1752317264-FrontSafeZones.svg'
    },
    backsafezone_design: {
      id: 126261,
      design_position: 'backsafezone',
      file_url:
        'super_admin/files/container/307/307/skargarden/1752317264-BackSafeZones.svg'
    },
    productionsafezone_design: null,
    frontboundary_design: {
      id: 85537,
      design_position: 'frontboundary',
      file_url:
        'super_admin/files/container/307/307/skargarden/1752317264-frontboundary.svg'
    },
    backboundary_design: {
      id: 126289,
      design_position: 'backboundary',
      file_url:
        'super_admin/files/container/307/307/skargarden/1752317264-backboundary.svg'
    },
    production_design: {
      id: 53608,
      file_id: 307,
      container_id: 307,
      design_name: 'skargarden',
      design_position: 'production',
      color_group: '{}',
      file_name: '1752317264-Production',
      file_url:
        'super_admin/files/container/307/307/skargarden/1752317264-Production',
      file_extension: 'svg',
      svg_parts: [
        'diamond',
        'collar-2',
        'collar-1',
        'shoulders',
        'shoulder-stripe',
        'base',
        'cuffs',
        'stripe-3',
        'stripe-1',
        'stripe-2'
      ]
    }
  }
}

export const mockProductPreviews: ProductPreviewItem[] = [
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: '2000-series hockey jersey',
      id: 146,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 146,
      productnames: []
    },
    stylePreview: {
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
    designPreview: {
      id: 56073,
      is_default: 1,
      front_design: {
        color_group: null,
        design_name: 'Alberta',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/Alberta/1752317259-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Alberta/1752317259-Front.svg',
        file_url:
          'super_admin/files/container/307/307/Alberta/1752317259-Front.svg',
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
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: '1000-series hockey jersey',
      id: 144,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 144,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/2000_b-neck_front_highlights-65e72ec414851.png',
          id: 817,
          thumb_sm_url:
            'super_admin/files/product/base_model/2000_b-neck_front_highlights_150-65e72ec414851.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/2000_b-neck_front_Shadows-65e72ec80d4ed.png',
          id: 819,
          thumb_sm_url:
            'super_admin/files/product/base_model/2000_b-neck_front_Shadows_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        }
      ],
      id: 207,
      logo: [],
      name: 'V-neck',
      product_id: 144
    },
    designPreview: {
      id: 56072,
      is_default: 0,
      front_design: {
        color_group: '{}',
        design_name: 'Alberta',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/409/409/AAlborg-Pirates/1751278398-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/409/409/AAlborg-Pirates/1751278398-Front.svg',
        file_url:
          'super_admin/files/container/409/409/AAlborg-Pirates/1751278398-Front.svg',
        id: 129632
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_base_url:
          'super_admin/files/container/307/307/Alberta/1752317259-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Alberta/1752317259-FrontSafeZones.svg',
        file_url:
          'super_admin/files/container/307/307/Alberta/1752317259-FrontSafeZones.svg',
        id: 129635
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/Alberta/1752317260-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Alberta/1752317260-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/Alberta/1752317260-frontboundary.svg',
        id: 129637
      },
      svg_parts: [
        'base',
        'sleeves',
        'shoulder',
        'sleeves-stripe-4',
        'stripe-2',
        'stripe-3',
        'stripe-4',
        'stripe-1',
        'design-1',
        'sleeves-design',
        'sleeves-stripe-2',
        'sleeves-stripe-3',
        'sleeves-stripe-1',
        'shoulder-ends',
        'collar-1',
        'v',
        'collar-3',
        'collar-2',
        'design',
        'diamond',
        'shoulders',
        'shoulder-stripe',
        'cuffs'
      ]
    }
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: '3000-series hockey jersey',
      id: 145,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 145,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/3000_crew_front_highlights-65e72ec414851.png',
          id: 850,
          thumb_sm_url:
            'super_admin/files/product/base_model/3000_crew_front_highlights_150-65e72ec414851.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/3000_crew_front_Shadows-65e72ec80d4ed.png',
          id: 851,
          thumb_sm_url:
            'super_admin/files/product/base_model/3000_crew_front_Shadows_150-65e72ec414851.png',
          type: '2d_detail_layer'
        }
      ],
      id: 213,
      logo: [],
      name: 'Crew neck',
      product_id: 145
    },
    designPreview: {
      id: 56074,
      is_default: 1,
      front_design: {
        color_group: '{}',
        design_name: 'Boden Home',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/boden-Home/1752317260-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/boden-Home/1752317260-Front.svg',
        file_url:
          'super_admin/files/container/307/307/boden-Home/1752317260-Front.svg',
        id: 68942
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_base_url:
          'super_admin/files/container/307/307/boden-Home/1752317261-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/boden-Home/1752317261-FrontSafeZones.svg',
        file_url:
          'super_admin/files/container/307/307/boden-Home/1752317261-FrontSafeZones.svg',
        id: 85629
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/boden-Home/1752317260-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/boden-Home/1752317260-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/boden-Home/1752317260-frontboundary.svg',
        id: 85630
      },
      svg_parts: [
        'base',
        'shoulders',
        'stripe-1',
        'stripe-2',
        'collar',
        'cuffs',
        'home-pattern'
      ]
    }
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: '4000-series hockey jersey',
      id: 147,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 147,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/4000_vneck_front_highlights-65e72ec414851.png',
          id: 852,
          thumb_sm_url:
            'super_admin/files/product/base_model/4000_vneck_front_highlights_150-65e72ec414851.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/4000_vneck_front_Shadows-65e72ec80d4ed.png',
          id: 853,
          thumb_sm_url:
            'super_admin/files/product/base_model/4000_vneck_front_Shadows_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        }
      ],
      id: 214,
      logo: [],
      name: 'V-neck',
      product_id: 147
    },
    designPreview: {
      id: 56075,
      is_default: 1,
      front_design: {
        color_group: '{}',
        design_name: 'Boston',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/boston/1752317262-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/boston/1752317262-Front.svg',
        file_url:
          'super_admin/files/container/307/307/boston/1752317262-Front.svg',
        id: 53706
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_base_url:
          'super_admin/files/container/307/307/boston/1752317263-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/boston/1752317263-FrontSafeZones.svg',
        file_url:
          'super_admin/files/container/307/307/boston/1752317263-FrontSafeZones.svg',
        id: 53709
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/boston/1752317262-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/boston/1752317262-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/boston/1752317262-frontboundary.svg',
        id: 85635
      },
      svg_parts: [
        'base',
        'shoulders',
        'stripe-pattern',
        'collar',
        'cuffs',
        'boston-design'
      ]
    }
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: '5000-series hockey jersey',
      id: 148,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 148,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/5000_crew_front_highlights-65e72ec414851.png',
          id: 854,
          thumb_sm_url:
            'super_admin/files/product/base_model/5000_crew_front_highlights_150-65e72ec414851.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/5000_crew_front_Shadows-65e72ec80d4ed.png',
          id: 855,
          thumb_sm_url:
            'super_admin/files/product/base_model/5000_crew_front_Shadows_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        }
      ],
      id: 215,
      logo: [],
      name: 'Crew neck',
      product_id: 148
    },
    designPreview: {
      id: 56076,
      is_default: 1,
      front_design: {
        color_group: '{}',
        design_name: 'Bow Valley Black',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/Bow-Vallley-Black/1752317264-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Bow-Vallley-Black/1752317264-Front.svg',
        file_url:
          'super_admin/files/container/307/307/Bow-Vallley-Black/1752317264-Front.svg',
        id: 180015
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_base_url:
          'super_admin/files/container/307/307/Bow-Vallley-Black/1752317265-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Bow-Vallley-Black/1752317265-FrontSafeZones.svg',
        file_url:
          'super_admin/files/container/307/307/Bow-Vallley-Black/1752317265-FrontSafeZones.svg',
        id: 180029
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/Bow-Vallley-Black/1752317264-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Bow-Vallley-Black/1752317264-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/Bow-Vallley-Black/1752317264-frontboundary.svg',
        id: 180020
      },
      svg_parts: [
        'base',
        'shoulders',
        'black-stripes',
        'collar',
        'cuffs',
        'bow-valley-pattern'
      ]
    }
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: '6000-series hockey jersey',
      id: 149,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 149,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/6000_vneck_front_highlights-65e72ec414851.png',
          id: 856,
          thumb_sm_url:
            'super_admin/files/product/base_model/6000_vneck_front_highlights_150-65e72ec414851.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/6000_vneck_front_Shadows-65e72ec80d4ed.png',
          id: 857,
          thumb_sm_url:
            'super_admin/files/product/base_model/6000_vneck_front_Shadows_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        }
      ],
      id: 216,
      logo: [],
      name: 'V-neck',
      product_id: 149
    },
    designPreview: {
      id: 56077,
      is_default: 1,
      front_design: {
        color_group: '{}',
        design_name: 'Bow Valley White',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/Bow-Vallley-White/1752317254-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Bow-Vallley-White/1752317254-Front.svg',
        file_url:
          'super_admin/files/container/307/307/Bow-Vallley-White/1752317254-Front.svg',
        id: 180092
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_url:
          'super_admin/files/container/307/307/Bow-Vallley-White/1752317254-FrontSafeZones.svg',
        id: 180095,
        file_base_url:
          'super_admin/files/container/307/307/Bow-Vallley-White/1752317254-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Bow-Vallley-White/1752317254-FrontSafeZones.svg'
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/Bow-Vallley-White/1752317254-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Bow-Vallley-White/1752317254-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/Bow-Vallley-White/1752317254-frontboundary.svg',
        id: 180096
      },
      svg_parts: [
        'base',
        'shoulders',
        'white-stripes',
        'collar',
        'cuffs',
        'bow-valley-white-pattern'
      ]
    }
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: '7000-series hockey jersey',
      id: 150,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 150,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/7000_crew_front_highlights-65e72ec414851.png',
          id: 858,
          thumb_sm_url:
            'super_admin/files/product/base_model/7000_crew_front_highlights_150-65e72ec414851.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/7000_crew_front_Shadows-65e72ec80d4ed.png',
          id: 859,
          thumb_sm_url:
            'super_admin/files/product/base_model/7000_crew_front_Shadows_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        }
      ],
      id: 217,
      logo: [],
      name: 'Crew neck',
      product_id: 150
    },
    designPreview: {
      id: 56078,
      is_default: 1,
      front_design: {
        color_group: '{}',
        design_name: 'Brant Blades',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/Brant-Blades/1752317264-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Brant-Blades/1752317264-Front.svg',
        file_url:
          'super_admin/files/container/307/307/Brant-Blades/1752317264-Front.svg',
        id: 180106
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_url:
          'super_admin/files/container/307/307/Brant-Blades/1752317264-FrontSafeZones.svg',
        id: 180109,
        file_base_url:
          'super_admin/files/container/307/307/Brant-Blades/1752317264-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Brant-Blades/1752317264-FrontSafeZones.svg'
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/Brant-Blades/1752317264-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Brant-Blades/1752317264-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/Brant-Blades/1752317264-frontboundary.svg',
        id: 180107
      },
      svg_parts: [
        'base',
        'shoulders',
        'blade-pattern',
        'collar',
        'cuffs',
        'brant-design'
      ]
    }
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: '8000-series hockey jersey',
      id: 151,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 151,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/8000_vneck_front_highlights-65e72ec414851.png',
          id: 860,
          thumb_sm_url:
            'super_admin/files/product/base_model/8000_vneck_front_highlights_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/8000_vneck_front_Shadows-65e72ec80d4ed.png',
          id: 861,
          thumb_sm_url:
            'super_admin/files/product/base_model/8000_vneck_front_Shadows_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        }
      ],
      id: 218,
      logo: [],
      name: 'V-neck',
      product_id: 151
    },
    designPreview: {
      id: 56079,
      is_default: 1,
      front_design: {
        color_group: '{}',
        design_name: 'Brohman',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/Brohman/1752317257-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Brohman/1752317257-Front.svg',
        file_url:
          'super_admin/files/container/307/307/Brohman/1752317257-Front.svg',
        id: 129639
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_url:
          'super_admin/files/container/307/307/Brohman/1752317257-FrontSafeZones.svg',
        id: 129642,
        file_base_url:
          'super_admin/files/container/307/307/Brohman/1752317257-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Brohman/1752317257-FrontSafeZones.svg'
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/Brohman/1752317257-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Brohman/1752317257-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/Brohman/1752317257-frontboundary.svg',
        id: 129640
      },
      svg_parts: [
        'base',
        'shoulders',
        'brohman-pattern',
        'collar',
        'cuffs',
        'stripe-design'
      ]
    }
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: '9000-series hockey jersey',
      id: 152,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 152,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/9000_crew_front_highlights-65e72ec414851.png',
          id: 862,
          thumb_sm_url:
            'super_admin/files/product/base_model/9000_crew_front_highlights_150-65e72ec414851.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/9000_crew_front_Shadows-65e72ec80d4ed.png',
          id: 863,
          thumb_sm_url:
            'super_admin/files/product/base_model/9000_crew_front_Shadows_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        }
      ],
      id: 219,
      logo: [],
      name: 'Crew neck',
      product_id: 152
    },
    designPreview: {
      id: 56080,
      is_default: 1,
      front_design: {
        color_group: '{}',
        design_name: 'Brombyx',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/brombyx/1752317262-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/brombyx/1752317262-Front.svg',
        file_url:
          'super_admin/files/container/307/307/brombyx/1752317262-Front.svg',
        id: 53734
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_url:
          'super_admin/files/container/307/307/brombyx/1752317263-FrontSafeZones.svg',
        id: 53737,
        file_base_url:
          'super_admin/files/container/307/307/brombyx/1752317263-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/brombyx/1752317263-FrontSafeZones.svg'
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/brombyx/1752317262-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/brombyx/1752317262-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/brombyx/1752317262-frontboundary.svg',
        id: 53735
      },
      svg_parts: [
        'base',
        'shoulders',
        'brombyx-pattern',
        'collar',
        'cuffs',
        'stripe-design'
      ]
    }
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: 'Elite-series hockey jersey',
      id: 153,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 153,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/elite_vneck_front_highlights-65e72ec414851.png',
          id: 864,
          thumb_sm_url:
            'super_admin/files/product/base_model/elite_vneck_front_highlights_150-65e72ec414851.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/elite_vneck_front_Shadows-65e72ec80d4ed.png',
          id: 865,
          thumb_sm_url:
            'super_admin/files/product/base_model/elite_vneck_front_Shadows_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        }
      ],
      id: 220,
      logo: [],
      name: 'V-neck',
      product_id: 153
    },
    designPreview: {
      id: 56081,
      is_default: 1,
      front_design: {
        color_group: '{}',
        design_name: 'Bruins',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/Bruins/1752317259-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Bruins/1752317259-Front.svg',
        file_url:
          'super_admin/files/container/307/307/Bruins/1752317259-Front.svg',
        id: 53962
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_url:
          'super_admin/files/container/307/307/Bruins/1752317259-FrontSafeZones.svg',
        id: 53965,
        file_base_url:
          'super_admin/files/container/307/307/Bruins/1752317259-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Bruins/1752317259-FrontSafeZones.svg'
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/Bruins/1752317259-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/Bruins/1752317259-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/Bruins/1752317259-frontboundary.svg',
        id: 53963
      },
      svg_parts: [
        'base',
        'shoulders',
        'bruins-pattern',
        'collar',
        'cuffs',
        'stripe-design'
      ]
    }
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: 'Pro-series hockey jersey',
      id: 154,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 154,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/pro_crew_front_highlights-65e72ec414851.png',
          id: 866,
          thumb_sm_url:
            'super_admin/files/product/base_model/pro_crew_front_highlights_150-65e72ec414851.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/pro_crew_front_Shadows-65e72ec80d4ed.png',
          id: 867,
          thumb_sm_url:
            'super_admin/files/product/base_model/pro_crew_front_Shadows_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        }
      ],
      id: 221,
      logo: [],
      name: 'Crew neck',
      product_id: 154
    },
    designPreview: {
      id: 56082,
      is_default: 1,
      front_design: {
        color_group: '{}',
        design_name: 'Brynas',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/brynas/1752317261-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/brynas/1752317261-Front.svg',
        file_url:
          'super_admin/files/container/307/307/brynas/1752317261-Front.svg',
        id: 53710
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_url:
          'super_admin/files/container/307/307/brynas/1752317262-FrontSafeZones.svg',
        id: 53713,
        file_base_url:
          'super_admin/files/container/307/307/brynas/1752317262-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/brynas/1752317262-FrontSafeZones.svg'
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/brynas/1752317261-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/brynas/1752317261-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/brynas/1752317261-frontboundary.svg',
        id: 53712
      },
      svg_parts: [
        'base',
        'shoulders',
        'brynas-pattern',
        'collar',
        'cuffs',
        'stripe-design'
      ]
    }
  },
  {
    productPreview: {
      allowed_logos_count: 0,
      colors: [],
      display_name: 'Champion-series hockey jersey',
      id: 155,
      is_logo_allowed: 1,
      measurement_ratio: 0.1458,
      product_id: 155,
      productnames: []
    },
    stylePreview: {
      front_models: [
        {
          composition: 'screen',
          file_url:
            'super_admin/files/product/base_model/champion_vneck_front_highlights-65e72ec414851.png',
          id: 868,
          thumb_sm_url:
            'super_admin/files/product/base_model/champion_vneck_front_highlights_150-65e72ec414851.png',
          type: '2d_detail_layer'
        },
        {
          composition: 'multiply',
          file_url:
            'super_admin/files/product/base_model/champion_vneck_front_Shadows-65e72ec80d4ed.png',
          id: 869,
          thumb_sm_url:
            'super_admin/files/product/base_model/champion_vneck_front_Shadows_150-65e72ec80d4ed.png',
          type: '2d_detail_layer'
        }
      ],
      id: 222,
      logo: [],
      name: 'V-neck',
      product_id: 155
    },
    designPreview: {
      id: 56083,
      is_default: 1,
      front_design: {
        color_group: '{}',
        design_name: 'Buffalo',
        design_position: 'front',
        file_base_url:
          'super_admin/files/container/307/307/buffalo/1752317262-Front.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/buffalo/1752317262-Front.svg',
        file_url:
          'super_admin/files/container/307/307/buffalo/1752317262-Front.svg',
        id: 53694
      },
      frontsafezone_design: {
        design_position: 'frontsafezone',
        file_url:
          'super_admin/files/container/307/307/buffalo/1752317262-FrontSafeZones.svg',
        id: 53697,
        file_base_url:
          'super_admin/files/container/307/307/buffalo/1752317262-FrontSafeZones.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/buffalo/1752317262-FrontSafeZones.svg'
      },
      frontboundary_design: {
        design_position: 'frontboundary',
        file_base_url:
          'super_admin/files/container/307/307/buffalo/1752317262-frontboundary.svg',
        file_extension: 'svg',
        file_thumbnail_url:
          'super_admin/files/container/307/307/buffalo/1752317262-frontboundary.svg',
        file_url:
          'super_admin/files/container/307/307/buffalo/1752317262-frontboundary.svg',
        id: 53695
      },
      svg_parts: [
        'base',
        'shoulders',
        'buffalo-pattern',
        'collar',
        'cuffs',
        'stripe-design'
      ]
    }
  }
]

// New mock data for 1000-series hockey jersey based on provided JSON
export const mockActiveProductDetails1000Series: ActiveProductDetails = {
  productDetails: {
    allowed_logos_count: 0,
    colors: [],
    display_name: '1000-series hockey jersey',
    id: 144,
    is_logo_allowed: 1,
    logos_setting: [],
    measurement_ratio: 0.1458,
    product_id: 144,
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
    product_addons: [],
    company_addons: [],
    active_addons: [],
    sku: {
      addon_group_id: null,
      asana_task_template_id: null,
      customized_sku_info: null,
      data_container_id: null,
      design_customer_approval: 1,
      factory_id: null,
      id: 161,
      image_url:
        'factory_10/files/sku/11_Hockey%2BJersey%2BUnisex%2B-%2BSizechart%2BCustimoo16850189981694166407.jpg',
      sizechart_reference: 'Hockey jerseys',
      sku_id: '1000-series hockey jersey',
      sku_number: 1071,
      specs_sheet_url: null
    },
    sku_id: 161,
    sort_order: 20,
    step_completed: 3,
    svg_group_color_container: {},
    sync_id: null,
    url_slug: 'ninja_1000_hockey_jersey',
    using_logo_colors: 0
  },
  styleDetails: {
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
    container_id: 292,
    created_at: '2022-09-27T08:38:41.000000Z',
    customized_addons: { grouped_addons: {}, ungrouped_addons: [] },
    default_style: 1,
    deleted_at: null,
    front_models: [
      {
        composition: 'screen',
        file_url:
          'super_admin/files/product/base_model/2000_b-neck_front_highlights-65e72ec414851.png',
        id: 817,
        thumb_sm_url:
          'super_admin/files/product/base_model/2000_b-neck_front_highlights_150-65e72ec414851.png',
        type: '2d_detail_layer'
      },
      {
        composition: 'multiply',
        file_url:
          'super_admin/files/product/base_model/2000_b-neck_front_Shadows-65e72ec80d4ed.png',
        id: 819,
        thumb_sm_url:
          'super_admin/files/product/base_model/2000_b-neck_front_Shadows_150-65e72ec80d4ed.png',
        type: '2d_detail_layer'
      }
    ],
    id: 207,
    is_default: 1,
    is_fixed_logos_all: true,
    logo: [],
    logo_technologies: [],
    metalness: null,
    name: 'V-neck',
    product_id: 144,
    roughness: null,
    style_icon: 787,
    style_icon_id: null,
    style_icon_url: 'factory_10/files/10/product/style_icon/V-neck2.png',
    updated_at: '2023-10-31T13:46:43.000000Z'
  },
  designDetails: {
    id: 56072,
    is_default: 0,
    back_design: {
      color_group: '{}',
      design_name: 'Alberta',
      design_position: 'back',
      file_base_url:
        'super_admin/files/container/307/307/Alberta/1752317259-Back.svg',
      file_extension: 'svg',
      file_thumbnail_url:
        'super_admin/files/container/307/307/Alberta/1752317259-Back.svg',
      file_url: 'super_admin/files/container/307/307/Alberta/1752317259-Back',
      id: 129633
    },
    backboundary_design: {
      design_position: 'backboundary',
      file_base_url:
        'super_admin/files/container/307/307/Alberta/1752317260-backboundary.svg',
      file_extension: 'svg',
      file_thumbnail_url:
        'super_admin/files/container/307/307/Alberta/1752317260-backboundary.svg',
      file_url:
        'super_admin/files/container/307/307/Alberta/1752317260-backboundary.svg',
      id: 129638
    },
    backsafezone_design: {
      design_position: 'backsafezone',
      file_base_url:
        'super_admin/files/container/307/307/Alberta/1752317260-BackSafeZones.svg',
      file_extension: 'svg',
      file_thumbnail_url:
        'super_admin/files/container/307/307/Alberta/1752317260-BackSafeZones.svg',
      file_url:
        'super_admin/files/container/307/307/Alberta/1752317260-BackSafeZones.svg',
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
        'super_admin/files/container/307/307/Alberta/1752317259-FrontSafeZones.svg',
      file_extension: 'svg',
      file_thumbnail_url:
        'super_admin/files/container/307/307/Alberta/1752317259-FrontSafeZones.svg',
      file_url:
        'super_admin/files/container/307/307/Alberta/1752317259-FrontSafeZones.svg',
      id: 129635
    },
    frontboundary_design: {
      design_position: 'frontboundary',
      file_base_url:
        'super_admin/files/container/307/307/Alberta/1752317260-frontboundary.svg',
      file_extension: 'svg',
      file_thumbnail_url:
        'super_admin/files/container/307/307/Alberta/1752317260-frontboundary.svg',
      file_url:
        'super_admin/files/container/307/307/Alberta/1752317260-frontboundary.svg',
      id: 129637
    },
    front_design: {
      color_group: '{}',
      design_name: 'Alberta',
      design_position: 'front',
      file_base_url:
        'super_admin/files/container/307/307/Alberta/1752317259-Front.svg',
      file_extension: 'svg',
      file_thumbnail_url:
        'super_admin/files/container/307/307/Alberta/1752317259-Front.svg',
      file_url: 'super_admin/files/container/307/307/Alberta/1752317259-Front',
      id: 129632
    },
    front_design_id: 129632,
    is_active: 1,
    production_design: {
      design_position: 'production',
      file_base_url:
        'super_admin/files/container/307/307/Alberta/1752317259-Production.svg',
      file_extension: 'svg',
      file_thumbnail_url:
        'super_admin/files/container/307/307/Alberta/1752317259-Production.svg',
      file_url:
        'super_admin/files/container/307/307/Alberta/1752317259-Production',
      id: 129634
    },
    production_design_id: 129634,
    productionsafezone_design: null,
    productionsafezone_design_id: null,
    product_id: 144,
    product_style_id: 207,
    updated_at: '2025-06-30T10:05:03.000000Z',
    svg_parts: [
      'base',
      'sleeves',
      'shoulder',
      'sleeves-stripe-4',
      'stripe-2',
      'stripe-3',
      'stripe-4',
      'stripe-1',
      'design-1',
      'sleeves-design',
      'sleeves-stripe-2',
      'sleeves-stripe-3',
      'sleeves-stripe-1',
      'shoulder-ends',
      'collar-1',
      'v',
      'collar-3',
      'collar-2',
      'design',
      'diamond',
      'shoulders',
      'shoulder-stripe',
      'cuffs'
    ]
  }
}

// Mock company addons based on provided JSON data
export const mockCompanyAddons = [
  {
    id: 17,
    company_id: 6,
    addon_id: 313,
    addon_sync_id: null,
    addon_ecommerce_product_id: null,
    addon_ecommerce_variant_id: null,
    addon_ecommerce_modifier_id: null,
    addon_data: {
      note: null,
      title: 'Fight strap',
      currencies: [
        {
          code: 'DKK',
          name: 'Danish Krone',
          price: 0,
          symbol: 'Kr.'
        },
        {
          code: 'SEK',
          name: 'Swedish Krona',
          price: 0,
          symbol: 'kr'
        },
        {
          code: 'GBP',
          name: 'Pound Sterling',
          price: 0,
          symbol: '£'
        },
        {
          code: 'EUR',
          name: 'Euro',
          price: 0,
          symbol: '€'
        },
        {
          code: 'CAD',
          name: 'Canadian Dollar',
          price: 3.99,
          symbol: 'C$'
        },
        {
          code: 'USD',
          name: 'United States Dollar',
          price: 5,
          symbol: '$'
        }
      ],
      description: '<p>Fight strap</p>'
    },
    created_at: '2023-11-22T08:44:39.000000Z',
    updated_at: '2023-11-24T10:13:05.000000Z',
    deleted_at: null
  },
  {
    id: 222,
    company_id: 6,
    addon_id: 314,
    addon_sync_id: null,
    addon_ecommerce_product_id: null,
    addon_ecommerce_variant_id: null,
    addon_ecommerce_modifier_id: null,
    addon_data: {
      note: null,
      title: 'Sublimated name patch',
      currencies: [
        {
          code: 'DKK',
          name: 'Danish Krone',
          price: 0,
          symbol: 'Kr.'
        },
        {
          code: 'SEK',
          name: 'Swedish Krona',
          price: 0,
          symbol: 'kr'
        },
        {
          code: 'GBP',
          name: 'Pound Sterling',
          price: 0,
          symbol: '£'
        },
        {
          code: 'EUR',
          name: 'Euro',
          price: 0,
          symbol: '€'
        },
        {
          code: 'CAD',
          name: 'Canadian Dollar',
          price: 4.66,
          symbol: 'C$'
        },
        {
          code: 'USD',
          name: 'United States Dollar',
          price: 3.5,
          symbol: '$'
        }
      ],
      description: '<p>Sublimated velcro name patch</p>'
    },
    created_at: '2023-11-24T09:13:32.000000Z',
    updated_at: '2023-11-24T10:13:05.000000Z',
    deleted_at: null
  },
  {
    id: 380,
    company_id: 6,
    addon_id: 320,
    addon_sync_id: null,
    addon_ecommerce_product_id: null,
    addon_ecommerce_variant_id: null,
    addon_ecommerce_modifier_id: null,
    addon_data: {
      note: null,
      title: 'Double shoulders',
      currencies: [
        {
          code: 'DKK',
          name: 'Danish Krone',
          price: 30,
          symbol: 'Kr.'
        },
        {
          code: 'SEK',
          name: 'Swedish Krona',
          price: 0,
          symbol: 'kr'
        },
        {
          code: 'GBP',
          name: 'Pound Sterling',
          price: 0,
          symbol: '£'
        },
        {
          code: 'EUR',
          name: 'Euro',
          price: 0,
          symbol: '€'
        },
        {
          code: 'CAD',
          name: 'Canadian Dollar',
          price: 5.4,
          symbol: 'C$'
        },
        {
          code: 'USD',
          name: 'United States Dollar',
          price: 4,
          symbol: '$'
        }
      ],
      description: '<p>Double shoulders</p>'
    },
    created_at: '2023-11-24T09:21:03.000000Z',
    updated_at: '2023-11-24T10:13:05.000000Z',
    deleted_at: null
  },
  {
    id: 381,
    company_id: 6,
    addon_id: 321,
    addon_sync_id: null,
    addon_ecommerce_product_id: null,
    addon_ecommerce_variant_id: null,
    addon_ecommerce_modifier_id: null,
    addon_data: {
      note: null,
      title: 'Double elbows',
      currencies: [
        {
          code: 'DKK',
          name: 'Danish Krone',
          price: 15,
          symbol: 'Kr.'
        },
        {
          code: 'SEK',
          name: 'Swedish Krona',
          price: 0,
          symbol: 'kr'
        },
        {
          code: 'GBP',
          name: 'Pound Sterling',
          price: 0,
          symbol: '£'
        },
        {
          code: 'EUR',
          name: 'Euro',
          price: 0,
          symbol: '€'
        },
        {
          code: 'CAD',
          name: 'Canadian Dollar',
          price: 2.7,
          symbol: 'C$'
        },
        {
          code: 'USD',
          name: 'United States Dollar',
          price: 2,
          symbol: '$'
        }
      ],
      description: '<p>Double elbows</p>'
    },
    created_at: '2023-11-24T09:21:03.000000Z',
    updated_at: '2023-11-24T10:13:05.000000Z',
    deleted_at: null
  }
]

// Mock active addons based on provided JSON data
export const mockActiveAddons = [
  {
    addon_group_id: null,
    data_container_id: null,
    customized_sku_info: null,
    addon_id: 314,
    title: 'Sublimated name patch',
    description: '<p>Sublimated velcro name patch</p>',
    note: null,
    currencies: [
      {
        name: 'United States Dollar',
        code: 'USD',
        symbol: '$',
        price: 6
      }
    ],
    selected: false,
    published: true,
    addon_ecommerce_product_id: null,
    addon_ecommerce_variant_id: null,
    addon_ecommerce_modifier_id: null
  },
  {
    addon_group_id: null,
    data_container_id: null,
    customized_sku_info: null,
    addon_id: 316,
    title: 'Sublimated sponsor patches',
    description: '<p>Sublimated sponsor patches</p>',
    note: null,
    currencies: [
      {
        name: 'United States Dollar',
        code: 'USD',
        symbol: '$',
        price: 4
      }
    ],
    selected: false,
    published: true,
    addon_ecommerce_product_id: null,
    addon_ecommerce_variant_id: null,
    addon_ecommerce_modifier_id: null
  },
  {
    addon_group_id: null,
    data_container_id: null,
    customized_sku_info: null,
    addon_id: 317,
    title: 'Sublimated logo patch',
    description: '<p>Sublimated logo patch</p>',
    note: null,
    currencies: [
      {
        name: 'United States Dollar',
        code: 'USD',
        symbol: '$',
        price: 4
      }
    ],
    selected: false,
    published: true,
    addon_ecommerce_product_id: null,
    addon_ecommerce_variant_id: null,
    addon_ecommerce_modifier_id: null
  },
  {
    addon_group_id: null,
    data_container_id: null,
    customized_sku_info: null,
    addon_id: 320,
    title: 'Double shoulders',
    description: '<p>Double shoulders</p>',
    note: null,
    currencies: [
      {
        name: 'United States Dollar',
        code: 'USD',
        symbol: '$',
        price: 2
      }
    ],
    selected: false,
    published: true,
    addon_ecommerce_product_id: null,
    addon_ecommerce_variant_id: null,
    addon_ecommerce_modifier_id: null
  },
  {
    addon_group_id: null,
    data_container_id: null,
    customized_sku_info: null,
    addon_id: 321,
    title: 'Double elbows',
    description: '<p>Double elbows</p>',
    note: null,
    currencies: [
      {
        name: 'United States Dollar',
        code: 'USD',
        symbol: '$',
        price: 2
      }
    ],
    selected: false,
    published: true,
    addon_ecommerce_product_id: null,
    addon_ecommerce_variant_id: null,
    addon_ecommerce_modifier_id: null
  },
  {
    addon_group_id: null,
    data_container_id: null,
    customized_sku_info: null,
    addon_id: 313,
    title: 'Fight strap',
    description: '<p>Fight strap</p>',
    note: null,
    currencies: [
      {
        name: 'United States Dollar',
        code: 'USD',
        symbol: '$',
        price: 3
      }
    ],
    selected: false,
    published: true,
    addon_ecommerce_product_id: null,
    addon_ecommerce_variant_id: null,
    addon_ecommerce_modifier_id: null
  }
]

// Mock design variant - Anaheim design based on provided JSON
export const mockAnaheimDesign = {
  id: 38783,
  is_default: 0,
  back_design: {
    color_group: '{}',
    design_name: 'Anaheim',
    design_position: 'back',
    file_base_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-Back.svg',
    file_extension: 'svg',
    file_thumbnail_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-Back.svg',
    file_url: 'super_admin/files/container/307/307/Anaheim/1752317263-Back',
    id: 53739
  },
  backboundary_design: {
    design_position: 'backboundary',
    file_base_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-backboundary.svg',
    file_extension: 'svg',
    file_thumbnail_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-backboundary.svg',
    file_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-backboundary.svg',
    id: 126260
  },
  container_file_id: 307,
  created_at: '2023-10-03T07:09:08.000000Z',
  deleted_at: null,
  design_name: 'Anaheim',
  design_show: 0,
  design_show_on_scroll: 1,
  frontsafezone_design: {
    design_position: 'frontsafezone',
    file_base_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-FrontSafeZones.svg',
    file_extension: 'svg',
    file_thumbnail_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-FrontSafeZones.svg',
    file_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-FrontSafeZones.svg',
    id: 53741
  },
  frontboundary_design: {
    design_position: 'frontboundary',
    file_base_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-frontboundary.svg',
    file_extension: 'svg',
    file_thumbnail_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-frontboundary.svg',
    file_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-frontboundary.svg',
    id: 85625
  },
  front_design: {
    color_group: '{}',
    design_name: 'Anaheim',
    design_position: 'front',
    file_base_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-Front.svg',
    file_extension: 'svg',
    file_thumbnail_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-Front.svg',
    file_url: 'super_admin/files/container/307/307/Anaheim/1752317263-Front',
    id: 53738
  },
  front_design_id: 53738,
  is_active: 1,
  production_design: {
    design_position: 'production',
    file_base_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-Production.svg',
    file_extension: 'svg',
    file_thumbnail_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-Production.svg',
    file_url:
      'super_admin/files/container/307/307/Anaheim/1752317263-Production',
    id: 53740
  },
  production_design_id: 53740,
  productionsafezone_design: null,
  productionsafezone_design_id: null,
  product_id: 144,
  product_style_id: 207,
  updated_at: '2025-06-30T10:03:51.000000Z',
  svg_parts: [
    'base',
    'shoulders',
    'shoulder-stripe-1',
    'stripe-3',
    'stripe-2',
    'stripe-1',
    'v',
    'collar-1',
    'collar-2',
    'diamond',
    'shoulder-stripe',
    'cuffs'
  ]
}

// Mock product configuration for 1000-series with comprehensive data
export const mockProductConfiguration1000Series = {
  active_addons: mockActiveAddons,
  colors: [],
  company_addons: mockCompanyAddons,
  ecommerceproduct: [],
  logo_technologies: [],
  logos_setting: [],
  namecolors: [],
  namefonts: [],
  product_addons: mockActiveAddons,
  productdesign: mockActiveProductDetails1000Series.designDetails,
  productdesigns_preview: [
    mockActiveProductDetails1000Series.designDetails,
    mockAnaheimDesign
  ],
  productstyle: mockActiveProductDetails1000Series.styleDetails,
  productstyles_preview: [mockActiveProductDetails1000Series.styleDetails],
  sizes: []
}

export function mockResponse<T>(data: T): AxiosResponse<T> {
  return { status: 200, data } as AxiosResponse<T>
}

export function mockDesignPreviewsByStyleId(_styleId: number) {
  // Reuse pieces from mockProductPreviews[0].defaultDesign and invent more
  const base = mockProductPreviews[0].designPreview
  const variants = [
    base,
    {
      ...base,
      id: base.id + 1,
      front_design: {
        ...base.front_design,
        design_name: 'Anaheim',
        file_base_url: base.front_design.file_base_url.replace(
          'Alberta',
          'Anaheim'
        ),
        file_thumbnail_url: base.front_design.file_thumbnail_url.replace(
          'Alberta',
          'Anaheim'
        ),
        file_url: base.front_design.file_url.replace('Alberta', 'Anaheim'),
        id: base.front_design.id + 100
      },
      frontsafezone_design: { ...base.frontsafezone_design },
      frontboundary_design: { ...base.frontboundary_design },
      svg_parts: base.svg_parts
    },
    {
      ...base,
      id: base.id + 2,
      front_design: {
        ...base.front_design,
        design_name: 'Apache',
        file_base_url: base.front_design.file_base_url.replace(
          'Alberta',
          'apache'
        ),
        file_thumbnail_url: base.front_design.file_thumbnail_url.replace(
          'Alberta',
          'apache'
        ),
        file_url: base.front_design.file_url.replace('Alberta', 'apache'),
        id: base.front_design.id + 200
      },
      frontsafezone_design: { ...base.frontsafezone_design },
      frontboundary_design: { ...base.frontboundary_design },
      svg_parts: base.svg_parts
    }
  ]
  return variants
}

// Styles: previews by product (style bases)
export function mockStylePreviewsByProduct(
  _productId: number
): OutputStylePreview[] {
  const s1 = mockActiveProductDetails.styleDetails
  const pid = mockActiveProductDetails.productDetails.id
  const bases: OutputStylePreview[] = [
    {
      id: s1.id,
      name: 'V-neck',
      product_id: pid,
      logo: [],
      front_models: s1.front_models
    },
    {
      id: s1.id + 1,
      name: 'Back middle',
      product_id: pid,
      logo: [],
      front_models: s1.front_models
    },
    {
      id: s1.id + 2,
      name: 'Laces',
      product_id: pid,
      logo: [],
      front_models: s1.front_models
    },
    {
      id: s1.id + 3,
      name: 'Standard',
      product_id: pid,
      logo: [],
      front_models: s1.front_models
    }
  ]
  return bases
}

// Active style details (style + its default design)
export function mockActiveStyleDetails(styleId: number) {
  const style = { ...mockActiveProductDetails.styleDetails, id: styleId }
  const design = {
    ...mockActiveProductDetails.designDetails,
    id: 56000 + styleId
  }
  return { productstyle: style, productdesign: design }
}

// Product addons bundle
export function mockProductAddons(_productId: number) {
  const active_addons = [
    {
      addon_group_id: null,
      data_container_id: null,
      customized_sku_info: null,
      addon_id: 313,
      title: 'Fight strap',
      description: '<p>Fight strap</p>',
      note: null,
      currencies: [
        { name: 'United States Dollar', code: 'USD', symbol: '$', price: 5 }
      ],
      selected: true,
      published: true,
      addon_ecommerce_product_id: null,
      addon_ecommerce_variant_id: null,
      addon_ecommerce_modifier_id: null
    }
  ]
  const product_addons = [
    {
      ...active_addons[0],
      selected: false,
      addon_id: 314,
      title: 'Sublimated name patch'
    }
  ]
  const company_addons: any[] = []
  return { active_addons, product_addons, company_addons }
}

// Mock design details by ID
export function mockDesignDetailsById(designId: number): OutputDesignDetails {
  return {
    id: designId,
    is_default: 1,
    front_design: {
      color_group: null,
      design_name: 'Mock Design',
      design_position: 'front',
      file_base_url: '/mock/designs',
      file_extension: 'svg',
      file_thumbnail_url: '/mock/designs/thumb.svg',
      file_url: '/mock/designs/front.svg',
      id: 1
    },
    back_design: {
      color_group: null,
      design_name: 'Mock Back Design',
      design_position: 'back',
      file_base_url: '/mock/designs',
      file_extension: 'svg',
      file_thumbnail_url: '/mock/designs/thumb.svg',
      file_url: '/mock/designs/back.svg',
      id: 2
    },
    frontboundary_design: {
      design_position: 'front',
      file_base_url: '/mock/designs',
      file_extension: 'svg',
      file_thumbnail_url: '/mock/designs/thumb.svg',
      file_url: '/mock/designs/frontboundary.svg',
      id: 3
    },
    backboundary_design: {
      design_position: 'back',
      file_base_url: '/mock/designs',
      file_extension: 'svg',
      file_thumbnail_url: '/mock/designs/thumb.svg',
      file_url: '/mock/designs/backboundary.svg',
      id: 4
    },
    frontsafezone_design: {
      design_position: 'front',
      file_base_url: '/mock/designs',
      file_extension: 'svg',
      file_thumbnail_url: '/mock/designs/thumb.svg',
      file_url: '/mock/designs/frontsafezone.svg',
      id: 5
    },
    backsafezone_design: {
      design_position: 'back',
      file_base_url: '/mock/designs',
      file_extension: 'svg',
      file_thumbnail_url: '/mock/designs/thumb.svg',
      file_url: '/mock/designs/backsafezone.svg',
      id: 6
    },
    container_file_id: 1,
    created_at: new Date().toISOString(),
    deleted_at: null,
    design_name: 'Mock Design',
    design_show: 1,
    design_show_on_scroll: 1,
    front_design_id: 1,
    back_design_id: 2,
    frontsafezone_design_id: 3,
    frontboundary_design_id: 4,
    backsafezone_design_id: 5,
    backboundary_design_id: 6,
    is_active: 1,
    production_design: {
      design_position: 'front',
      file_base_url: '/mock/designs',
      file_extension: 'svg',
      file_thumbnail_url: '/mock/designs/thumb.svg',
      file_url: '/mock/designs/production.svg',
      id: 1
    },
    production_design_id: 1,
    productionsafezone_design: {
      design_position: 'front',
      file_base_url: '/mock/designs',
      file_extension: 'svg',
      file_thumbnail_url: '/mock/designs/thumb.svg',
      file_url: '/mock/designs/productionsafezone.svg',
      id: 1
    },
    productionsafezone_design_id: 1,
    product_id: 1,
    product_style_id: 1,
    updated_at: new Date().toISOString(),
    svg_parts: ['mock-svg-part-1', 'mock-svg-part-2']
  }
}

// Recently uploaded logos (mocked from logos-recent-downloads.json)
export function mockRecentLogos(_companyId?: number): OutputRecentLogo[] {
  return [
    {
      id: 156848,
      company_id: 6,
      product_id: 146,
      is_vector: false,
      logo_name: 'logo-example.png',
      logo_url: '6/20724/logos/logoexample1756191636WeKHxUl1Jf_png.png',
      transparent_logo_url:
        '6/20724/logos/logoexample1756191636WeKHxUl1Jf_transparent.png',
      smart_transparent_logo_url:
        '6/20724/logos/logoexample1756191636WeKHxUl1Jf_smart_transparent.png',
      original_logo_url: '6/20724/logos/logoexample1756191636WeKHxUl1Jf.png',
      original_png: '6/20724/logos/logoexample1756191636WeKHxUl1Jf_png.png',
      browser_key: 'dd7875380e368841a0c8a9712338176e',
      logo_colors: [
        [41, 189, 249],
        [255, 176, 0],
        [239, 177, 26]
      ],
      recent_delete: 0,
      url: '6/20724/logos/logoexample1756191636WeKHxUl1Jf_png.png'
    },
    {
      id: 155434,
      company_id: 6,
      product_id: 147,
      is_vector: false,
      logo_name: 'Screenshot 2025-08-14 at 12.48.10.png',
      logo_url:
        '6/20724/logos/Screenshot20250814at12.48.101755610946W3QJR9tRPt_png.png',
      transparent_logo_url:
        '6/20724/logos/Screenshot20250814at12.48.101755610946W3QJR9tRPt_transparent.png',
      smart_transparent_logo_url:
        '6/20724/logos/Screenshot20250814at12.48.101755610946W3QJR9tRPt_smart_transparent.png',
      original_logo_url:
        '6/20724/logos/Screenshot20250814at12.48.101755610946W3QJR9tRPt.png',
      original_png:
        '6/20724/logos/Screenshot20250814at12.48.101755610946W3QJR9tRPt_png.png',
      browser_key: 'ef981ad8874fe2283b4f1ef509284ed8',
      logo_colors: [
        [250, 250, 250],
        [204, 229, 152],
        [149, 196, 141],
        [55, 55, 55],
        [30, 30, 30]
      ],
      recent_delete: 0,
      url: '6/20724/logos/Screenshot20250814at12.48.101755610946W3QJR9tRPt_png.png'
    }
  ]
}
