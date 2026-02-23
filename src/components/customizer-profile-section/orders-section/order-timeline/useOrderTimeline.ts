import type {
  ActivityItem,
  ContentGroup,
  FactoryProduct,
  GetActivityContentReturn,
  Item,
  Order
} from '@/services/orders/types'
import {
  CheckCircleIcon,
  FlagIcon,
  PencilIcon,
  TruckIcon,
  BanIcon,
  FactoryIcon,
  FileIcon
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { useFileDownload } from '@/composables/useFileDownload'

export function useOrderTimeline() {
  const { downloadFiles, isLoading } = useFileDownload()
  const CustimooOrderFlowStatuses: Record<string, string> = {
    quote_requested: 'Quote Requested',
    quote_rejected: 'Quote Rejected',
    quote_provided: 'Quote Provided',
    submitted_for_factory_review: 'Submitted for Factory Review',
    order_cancel: 'Cancelled',
    order_approve: 'Mark to Factory',
    factory_approved: 'Factory Approved',
    factory_rejected: 'Factory Rejected',
    submitted_for_customer_review: 'Submitted for Customer Review',
    customer_approved: 'Customer Approved',
    customer_rejected: 'Customer Rejected',
    in_production: 'In Production',
    shipped: 'Shipped',
    completed: 'Completed',
    pending_for_factory_assignment: 'Pending For Factory Assignment',
    production_files_uploaded: 'In Production',
    FACTORYREVIEW: 'submitted_for_factory_review',
    ORDERAPPROVE: 'order_approve',
    ORDERCANCEL: 'order_cancel',
    FACTORYAPPROVED: 'factory_approved',
    FACTORYREJECTED: 'factory_rejected',
    CUSTOMERREVIEW: 'submitted_for_customer_review',
    CUSTOMERAPPROVED: 'customer_approved',
    CUSTOMERREJECTED: 'customer_rejected',
    ORDERINPRODUCTION: 'in_production',
    ORDERSHIPPED: 'shipped',
    ORDERCOMPLETED: 'completed',
    FACTORY_APPROVE_REJECT: 'factory_approve_reject',
    PRODUCTIONFILESUPLOADED: 'production_files_uploaded',
    QUALITYCONTROL: 'quality_control',
    on_hold: 'On Hold'
  }

  const activityStatus: Record<string, { title: string; message: string }> = {
    quote_requested: {
      title: 'Quote Requested',
      message: 'Quote requested.'
    },
    quote_updated: {
      title: 'Quote Updated',
      message: 'Quote updated by customer.'
    },
    quote_rejected: {
      title: 'Quote Rejected',
      message: 'Quote rejected.'
    },
    quote_provided: {
      title: 'Quote provided',
      message: 'Quote provided by merchant.'
    },
    submitted_for_factory_review: {
      title: 'Order Created',
      message: 'Your order has been created and is awaiting confirmation.'
    },
    order_approve: {
      title: 'Order Confirmed, Pending Artwork',
      message:
        'Your order has been forwarded to the factory. They will review the logos and design for accuracy and quality, making any necessary adjustments for optimal printing.'
    },
    factory_approved: {
      title: 'Artwork Approved, Pending Test Print',
      message:
        'The factory has approved your artwork. Expect a physical sample to be uploaded within 72 hours (Monday to Friday).'
    },
    order_cancel: {
      title: 'Order Cancelled',
      message: 'You have cancelled the order.'
    },
    factory_rejected: {
      title: 'Artwork Rejected',
      message:
        'You rejected the Artwork. Please wait for the customer to edit and submit the artwork again.'
    },
    submitted_for_customer_review: {
      title: 'Design Sample Submitted',
      message:
        '<p>The factory has provided sample images. Once the test print(s) are approved, full production will begin.</p>\n' +
        '    <p><strong>Note:</strong> Any changes or comments before test print approval may delay production. Production starts after test print approval.</p>\n' +
        '    \n' +
        "    <ul class='list-disc pl-5 flex flex-col gap-2 w-full mb-1'>\n" +
        '        <li><strong>Sublimation Production Time:</strong> 3–4 weeks (including shipping)</li>\n' +
        '        <li><strong>Tackle Twill Production Time:</strong> 7–8 weeks (including shipping)</li>\n' +
        '    </ul>.'
    },
    customer_approved: {
      title: 'Design Sample Approved',
      message: 'Your sample has been approved. Production is now pending.'
    },
    customer_rejected: {
      title: 'Design Sample Rejected',
      message:
        'Customer has rejected the design samples. Please read the comments and upload new design samples.'
    },
    production_files_uploaded: {
      title: 'Production Files uploaded',
      message: 'Production Files uploaded'
    },
    in_production: {
      title: 'In Production',
      message: ` <p class='mb-2'>The factory has started manufacturing your products.</p>
                  <ul class='list-disc pl-5 flex flex-col gap-2 w-full mb-1'>
                      <li ><strong>Sublimation Production Time:</strong> 3–4 weeks (including shipping)</li>
                      <li><strong>Tackle Twill Production Time:</strong> 7–8 weeks (including shipping)</li>
                  </ul>
              <p class='bg-[#F3E3D0] flex gap-2 text-[#B26A12] p-1 rounded-md'><strong class="flex gap-2"> Important:</strong>  No further changes can be made at this stage.</p>`
    },
    quality_control: {
      title: 'Quality Control',
      message: 'Quality Control'
    },
    shipped: {
      title: 'Order Shipped',
      message: 'You shipped the products.'
    },
    completed: {
      title: 'Order Completed',
      message: 'This order has completed successfully.'
    },
    on_hold: {
      title: 'Order Put on Hold',
      message: 'The order has been put on hold.'
    },
    resume_order: {
      title: 'Order Resumed',
      message: 'The order hold has been removed.'
    }
  }

  const getActivityIcon = (status: string) => {
    const iconMap: Record<string, Component> = {
      submitted_for_factory_review: PencilIcon,
      order_approve: FileIcon,
      order_cancel: BanIcon,
      factory_approved: CheckCircleIcon,
      submitted_for_customer_review: PencilIcon,
      customer_approved: CheckCircleIcon,
      customer_rejected: BanIcon,
      in_production: FactoryIcon,
      shipped: TruckIcon,
      completed: FlagIcon,
      production_files_uploaded: FileIcon,
      quality_control: CheckCircleIcon,
      quote_provided: FileIcon
    }
    return iconMap[status] || FileIcon
  }

  const getActivityContent = (
    activity_items: ActivityItem[],
    activity_status: string,
    order: Order,
    order_item: Item
  ): GetActivityContentReturn => {
    const content_group: ContentGroup[] = []

    activity_items?.forEach((item: ActivityItem, index: number) => {
      content_group.push({
        images: Array.isArray(item?.activity_files)
          ? item.activity_files.map((file: { url: string; alt?: string; ext?: string }) => ({
              url: file?.url ?? '',
              alt: 'product img',
              ext: file?.url ? getFileExtension(file.url) : ''
            }))
          : [],
        design_id:
          Array.isArray(order_item?.factory_products) && order_item.factory_products[index]
            ? (order_item.factory_products[index].design_id as string)
            : null,
        nickName:
          order.additional_fields && order.additional_fields.is_manual_order
            ? (((order_item?.factory_products as Array<FactoryProduct>)[index] as FactoryProduct)
                ?.design_nick_name as string | null)
            : null,
        addons:
          Array.isArray(order_item?.factory_products) && order_item.factory_products[index]
            ? (order_item.factory_products[index]?.addons ?? [])
            : [],
        skipReason: item.skip_customer_approval?.reason ?? null,
        skip_customer_approval: item.skip_customer_approval,
        message: item.message ?? null,
        status: item.status,
        reorder_message: makeReorderMessage(
          item.factory_product_id,
          Array.isArray(order_item?.factory_products) ? order_item.factory_products : [],
          order
        ),
        third_party_approval_obj: item.third_party_approval_obj ?? null,
        quality_control: item.quality_control ?? null
      })
    })

    return {
      content_group,
      activity_status,
      general_comments: order.general_comments ?? null
    }
  }

  const makeReorderMessage = (
    factory_product_id: string,
    factory_products: FactoryProduct[],
    order: Order
  ) => {
    const factory_product: FactoryProduct | undefined = factory_products.find(
      (item: FactoryProduct) => item.id === factory_product_id
    )
    let message = ''
    if (factory_product && typeof factory_product === 'object' && !Array.isArray(factory_product)) {
      const reorder_data = (factory_product as { reorder_data?: Record<string, unknown> })
        .reorder_data
      if (reorder_data) {
        if (
          Object.prototype.hasOwnProperty.call(factory_product, 'is_possible_reorder') &&
          ((factory_product as Record<string, any>).is_possible_reorder as boolean) === true
        ) {
          message = `Note: Possible reorder of ${reorder_data.order_number ? 'order' : 'order_id'} #${reorder_data.order_number ? (reorder_data.order_number as string) : (reorder_data.order_id as string)} `
          if (reorder_data.roster_change === true && reorder_data.design_change === true) {
            message += 'with design and roster changes.'
          } else if (reorder_data.roster_change === true && reorder_data.design_change === false) {
            message += 'with roster changes.'
          } else if (reorder_data.roster_change === false && reorder_data.design_change === true) {
            message += 'with design changes.'
          } else {
            message += 'with no modifications'
          }

          if (!order.order_no) {
            message += ' (order not confirmed)'
          }
        } else {
          // Avoid unnecessary type assertions and avoid "unknown" as type in template literals.
          const hasOrderNumber =
            typeof reorder_data.order_number !== 'undefined' && reorder_data.order_number !== null
          const orderLabel = hasOrderNumber ? 'order' : 'order_id'
          const orderValue = hasOrderNumber
            ? String(reorder_data.order_number)
            : String(reorder_data.order_id)
          message = `Note: Reorder of ${orderLabel} #${orderValue} `

          // Cast to object with possible boolean properties to fix unsafe member access
          const { roster_change, design_change } = reorder_data as {
            roster_change?: boolean
            design_change?: boolean
          }

          if (roster_change === true && design_change === true) {
            message += 'with design and roster changes.'
          } else if (roster_change === true && design_change === false) {
            message += 'with roster changes.'
          } else if (reorder_data.roster_change === false && reorder_data.design_change === true) {
            message += 'with design changes.'
          } else {
            message += 'with no modifications'
          }

          if (!reorder_data.order_number) {
            message += ' (order not confirmed)'
          }
        }
      }
    }

    return message
  }

  // Helper functions
  const getFileExtension = (url: string): string => {
    if (!url) return ''
    return url.split('.').pop()?.toLowerCase() || ''
  }

  const isNullOrEmpty = (value: string | null | undefined): boolean => {
    return value === null || value === undefined || value === '' || value === 'null'
  }
  const downloadStatusActivityImages = async (
    activity_files: Array<{ url: string; name?: string; alt?: string }> = []
  ): Promise<void> => {
    if (!activity_files.length) {
      console.warn('No activity files to download')
      return
    }

    await downloadFiles(activity_files)
  }

  return {
    activityStatus,
    CustimooOrderFlowStatuses,
    getActivityIcon,
    getActivityContent,
    isNullOrEmpty,
    downloadStatusActivityImages,
    isLoading
  }
}
