<template>
  <div>
    <!-- <pre>{{ activity_content }}</pre> -->
    <div class="h-max">
      <slot></slot>
    </div>
    <div
      v-if="!isNullOrEmpty(reference_no)"
      class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-3"
    >
      <span class="font-semibold whitespace-nowrap">Customer Reference No:</span>
      <span class="px-3 py-1.5 text-xs break-all sm:break-normal">{{ reference_no }}</span>
    </div>
    <div
      v-if="activity_content?.content_group && activity_content.content_group.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6"
    >
      <div
        v-for="(content, index) in activity_content?.content_group || []"
        :key="`image-${index}`"
        class="h-max"
      >
        <div
          v-if="
            content.third_party_approval_obj && content.third_party_approval_obj.approval_status
          "
          class="mb-3"
        >
          <span
            class="inline-block px-3 py-1.5 text-xs font-medium rounded-full"
            :class="{
              'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300':
                content.third_party_approval_obj.approval_status === 'pending',
              'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300':
                content.third_party_approval_obj.approval_status === 'accepted',
              'bg-destructive/20 dark:bg-destructive/30 text-destructive dark:text-destructive':
                content.third_party_approval_obj.approval_status === 'rejected'
            }"
          >
            Third Party Status:
            {{
              content.third_party_approval_obj.approval_status.charAt(0).toUpperCase() +
              content.third_party_approval_obj.approval_status.slice(1)
            }}
          </span>
        </div>

        <div
          v-if="content.images && content.images.length > 0"
          class="border border-border rounded-lg h-full bg-card relative overflow-hidden"
        >
          <div class="absolute top-2 right-2 flex gap-2 z-10">
            <button
              v-if="
                order?.order_no &&
                order_item?.factory_products?.[index]?.can_reorder &&
                isEcommerceCompany
              "
              class="inline-flex items-center justify-center p-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-xs"
              :title="orders_action_reorder({}, { locale })"
              @click.stop="handleReorder(index)"
            >
              {{ orders_action_reorder({}, { locale }) }}
            </button>
            <button
              class="inline-flex items-center justify-center p-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
              :title="orders_action_download_images({}, { locale })"
              :disabled="downloadingIndex === index"
              @click.stop="handleDownloadImages(content.images, index)"
            >
              <DownloadIcon v-if="downloadingIndex !== index" class="w-4 h-4" />
              <Loader2Icon v-else class="w-4 h-4 animate-spin" />
            </button>
            <button
              class="inline-flex items-center justify-center p-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              :title="orders_action_view_details({}, { locale })"
              @click.stop="showActivityItemDetail(index)"
            >
              <ListIcon class="w-4 h-4" />
            </button>
          </div>
          <div class="flex items-center gap-3 mb-3 justify-between">
            <div class="flex min-h-6 items-center">
              <div v-if="content.nickName" class="text-xs sm:text-sm text-muted-foreground mb-3">
                <span class="font-semibold">Nick Name:</span>
                <span class="px-3 py-1.5 text-xs break-words">
                  {{ content.nickName }}
                </span>
              </div>
              <div v-else>
                <div class="h-full"></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <template v-for="(image, _imgIdx) in content.images" :key="_imgIdx">
              <div class="relative">
                <img
                  :src="image.url ? `${storage_url}${image.url}` : `${PLACEHOLDER_IMAGE}`"
                  :alt="image?.alt || ''"
                  class="object-contain h-48 sm:h-56 md:h-64 w-full cursor-pointer"
                  @click="onImageClick(image?.url ?? null, content)"
                  @error="onImageError"
                />

                <!-- Ribbon -->
                <div
                  v-if="isSampleOmitted(content) && _imgIdx === 0"
                  class="absolute top-[-30px] left-[-55px] z-20 pointer-events-none w-40 text-center text-xs font-bold bg-primary text-primary-foreground rotate-[-45deg] py-1"
                >
                  Sample<br />Omitted
                </div>
              </div>
            </template>
          </div>

          <div
            v-if="
              content.third_party_approval_obj &&
              content.third_party_approval_obj.approval_status === 'rejected' &&
              content.third_party_approval_obj.feedback
            "
            class="bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 rounded-md py-3 px-4 sm:px-5 mb-3 mt-3"
          >
            <div class="text-xs sm:text-sm mb-2">
              <span class="text-destructive mr-3 font-bold">Rejection Feedback</span>
            </div>
            <div class="text-destructive text-xs sm:text-sm break-words">
              {{ content.third_party_approval_obj.feedback }}
            </div>
          </div>
        </div>
        <div
          v-if="!isNullOrEmpty(content.design_id) && content.images.length > 0"
          class="text-xs sm:text-sm mb-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
        >
          <span class="font-semibold whitespace-nowrap">Design ID:</span>
          <span class="px-3 py-1.5 text-xs break-all sm:break-normal">{{ content.design_id }}</span>
        </div>

        <div
          v-if="content.addons.length > 0"
          class="flex flex-col sm:flex-row gap-2 sm:gap-3 text-xs sm:text-sm mb-3"
        >
          <div class="flex flex-wrap gap-2 sm:gap-3">
            <span class="font-semibold pr-2 whitespace-nowrap">Addons:</span>
            <span
              v-for="addon in content.addons"
              :key="`addon-${addon.addon_id}`"
              class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-normal break-words"
            >
              {{ addon.title }}
            </span>
          </div>
        </div>

        <div
          v-if="!isNullOrEmpty(content.skipReason)"
          class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 text-xs sm:text-sm"
        >
          <span class="font-semibold whitespace-nowrap">Skip Reason:</span>
          <span class="px-3 py-1.5 text-xs break-words">
            {{ content.skipReason }}
          </span>
        </div>

        <div
          v-if="!isNullOrEmpty(content.message)"
          class="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-3 text-xs sm:text-sm"
        >
          <span class="font-semibold whitespace-nowrap">Feedback:</span>
          <span class="text-muted-foreground break-words">{{ content.message }}</span>
        </div>
        <div
          v-if="
            activity_content?.activity_status === CustimooOrderFlowStatuses.FACTORYREVIEW &&
            !isNullOrEmpty(content.reorder_message)
          "
          class="text-xs sm:text-sm text-muted-foreground break-words"
        >
          {{ content.reorder_message }}
        </div>
        <div
          v-if="
            activity_content?.activity_status === CustimooOrderFlowStatuses.ORDERSHIPPED &&
            index === 0 &&
            order_item?.tracking_no
          "
          class="text-xs sm:text-sm text-muted-foreground mb-3"
        >
          The shipping no is
          <strong class="font-semibold">
            <a
              v-if="order_item.tracking_link"
              :href="order_item.tracking_link"
              target="_blank"
              class="text-primary hover:underline"
            >
              {{ order_item.tracking_no }}
            </a>
            <span v-else>{{ order_item.tracking_no }}</span>
          </strong>
        </div>
      </div>
    </div>
    <template v-if="activity_content?.general_comments">
      <div class="mb-3">
        <strong class="font-bold text-xs sm:text-sm">General Comments: </strong>
        <span class="text-xs sm:text-sm text-muted-foreground break-words">
          {{ activity_content.general_comments }}
        </span>
      </div>
    </template>
    <div
      v-if="
        props.statusActivityIndex === 0 &&
        order?.additional_fields?.po_number &&
        !isNullOrEmpty(order.additional_fields.po_number)
      "
      class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-3"
    >
      <span class="font-semibold whitespace-nowrap">PO Number:</span>
      <span class="px-3 py-1.5 text-xs break-all sm:break-normal">
        {{ order.additional_fields.po_number }}
      </span>
    </div>
    <div
      v-if="
        activity_content?.activity_status === 'quote_provided' &&
        order?.quote_text &&
        !isNullOrEmpty(order.quote_text)
      "
      class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-3"
    >
      <span class="font-semibold whitespace-nowrap">Quote provided price:</span>
      <span class="px-3 py-1.5 text-xs break-all sm:break-normal">
        {{ order.quote_text }}
      </span>
    </div>
    <div
      v-if="
        activity_content?.activity_status === 'quality_control' &&
        activity_content.content_group.find(item => 'quality_control' in item)
      "
      class="text-xs sm:text-sm text-muted-foreground w-full"
    >
      <ol class="list-decimal list-inside">
        <li
          v-for="(report, reportIdx) in activity_content.content_group.find(
            item => 'quality_control' in item
          )?.quality_control?.reports || []"
          :key="`report-${reportIdx}`"
        >
          QC report {{ report.status }}:
          <a class="text-primary hover:underline" :href="report.pdf_url" target="_blank">
            {{ decodeURIComponent(report.pdf_name) }}
          </a>
          submitted at {{ formatDate(report.created_at) }}
        </li>
      </ol>
    </div>
    <!-- Action Buttons for Factory Rejected -->
    <div
      v-if="
        status_activity?.status === CustimooOrderFlowStatuses.FACTORYREJECTED &&
        props.statusActivityIndex === 0
      "
      class="flex flex-wrap gap-2 mt-4"
    >
      <Button variant="secondary" @click="handleEditProducts">Edit Products</Button>
    </div>
    <!-- Action Buttons for Customer Review -->
    <div
      v-if="
        status_activity?.status === CustimooOrderFlowStatuses.CUSTOMERREVIEW &&
        order_item?.status === CustimooOrderFlowStatuses.CUSTOMERREVIEW &&
        props.statusActivityIndex === 0
      "
      class="flex flex-wrap gap-2 mt-4"
    >
      <Button
        v-if="
          status_activity?.activity_items &&
          status_activity.activity_items.length > 0 &&
          !status_activity.activity_items.some(
            (ai: any) =>
              ai.third_party_approval_obj && ai.third_party_approval_obj.approval_status !== ''
          )
        "
        variant="primary"
        @click="showThirdPartyApproval"
      >
        Third Party Approval
      </Button>
      <Button variant="primary" @click="showArtworkApproval">Take action</Button>
    </div>

    <div class="h-max">
      <slot name="comments"> </slot>
    </div>

    <!-- Order Item Detail Dialog -->
    <OrderItemDetailDialog
      v-model:open="showDetailDialog"
      :order="order"
      :factory-product="selectedFactoryProduct"
      :roster-data="rosterData"
      :preview-images="selectedPreviewImages"
      :order-id="order?.id"
    />

    <!-- Artwork Approval Dialog -->
    <ArtworkApprovalDialog
      v-model:open="showArtworkApprovalDialog"
      :status-activity="status_activity"
      :order-item="order_item"
      :order-item-index="props.orderItemIndex"
      :status-activity-index="props.statusActivityIndex"
      @approved="handleArtworkApproved"
    />

    <!-- Third Party Approval Dialog -->
    <ThirdPartyApprovalDialog
      v-model:open="showThirdPartyApprovalDialog"
      :order-item="order_item"
      @sent="handleThirdPartySent"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { DownloadIcon, ListIcon, Loader2Icon } from 'lucide-vue-next'
  import { onImageError, PLACEHOLDER_IMAGE } from '@/helpers/imageHelper'
  import { useOrderTimeline } from '@/components/customizer-profile-section/orders-section/order-timeline/useOrderTimeline'
  import type {
    GetActivityContentReturn,
    Order,
    Item,
    StatusActivity,
    FactoryProduct
  } from '@/services/orders/types'
  import type { APCustomizationRosterEntry } from '@/services/products/types/customization'
  import { formatDate } from '@/lib/utils'
  import OrderItemDetailDialog from './OrderItemDetailDialog.vue'
  import ArtworkApprovalDialog from './ArtworkApprovalDialog.vue'
  import ThirdPartyApprovalDialog from './ThirdPartyApprovalDialog.vue'
  import { Button } from '@/components/ui/button'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    orders_action_reorder,
    orders_action_download_images,
    orders_action_view_details
  } from '@/paraglide/messages'

  interface Props {
    activityContent?: GetActivityContentReturn
    referenceNo?: string
    orderItemId?: number | string
    order?: Order
    orderItem?: Item
    statusActivity?: StatusActivity
    orderItemIndex?: number
    statusActivityIndex?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    activityContent: () => ({
      content_group: [],
      activity_status: '',
      general_comments: null
    }),
    referenceNo: '',
    orderItemId: undefined,
    order: undefined,
    orderItem: undefined,
    statusActivity: undefined,
    orderItemIndex: undefined,
    statusActivityIndex: undefined
  })

  // Map props to match template usage
  const activity_content = computed(() => props.activityContent)
  const reference_no = computed(() => props.referenceNo)
  const order_item = computed(() => props.orderItem)
  const status_activity = computed(() => props.statusActivity)

  const storage_url = import.meta.env.VITE_APP_STORAGE_URL
  const emit = defineEmits<{
    (
      e: 'showPreview',
      contentGroup:
        | import('@/services/orders/types').ContentGroup
        | Array<{ url: string; alt?: string }>
    ): void
    (e: 'order-item-updated', orderItem: Item): void
  }>()
  const { isNullOrEmpty, CustimooOrderFlowStatuses, downloadStatusActivityImages } =
    useOrderTimeline()
  const companyStore = useCompanyStore()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const isEcommerceCompany = computed(() => {
    const company = companyStore.company
    return company?.platform === 'shopify' || company?.platform === 'wordpress'
  })

  function isSampleOmitted(content: import('@/services/orders/types').ContentGroup): boolean {
    if (!content.skip_customer_approval) return false

    const skipApproval = content.skip_customer_approval
    const designCustomerApproval = skipApproval.design_customer_approval

    // Check if design_customer_approval is false (string "false", boolean false, or 0)
    return (
      designCustomerApproval === false ||
      designCustomerApproval === 'false' ||
      designCustomerApproval === 0 ||
      designCustomerApproval === '0'
    )
  }

  const showDetailDialog = ref(false)
  const showArtworkApprovalDialog = ref(false)
  const showThirdPartyApprovalDialog = ref(false)
  const selectedFactoryProduct = ref<FactoryProduct | undefined>(undefined)
  const selectedPreviewImages = ref<Array<{ url: string; alt?: string; name?: string }>>([])
  const rosterData = ref<APCustomizationRosterEntry[]>([])
  const downloadingIndex = ref<number | null>(null)

  const onImageClick = (
    image_url: string | null,
    content?: import('@/services/orders/types').ContentGroup
  ) => {
    if (content && content.images && content.images.length > 0) {
      // Emit the entire content group so we can show all images
      emit('showPreview', content)
    } else if (image_url) {
      // Fallback: emit as array with single image
      emit('showPreview', [{ url: image_url }])
    }
  }

  function showActivityItemDetail(contentIndex: number) {
    if (
      !order_item.value ||
      !status_activity.value ||
      !status_activity.value.activity_items ||
      contentIndex >= status_activity.value.activity_items.length
    ) {
      return
    }

    const activityItem = status_activity.value.activity_items[contentIndex]
    const factoryProductIndex = order_item.value.factory_products?.findIndex(
      (fp: FactoryProduct) => fp.id === activityItem?.factory_product_id
    )

    if (factoryProductIndex !== undefined && factoryProductIndex >= 0) {
      selectedFactoryProduct.value = order_item.value.factory_products?.[factoryProductIndex]

      // Get preview images from activity files
      if (activityItem?.activity_files) {
        selectedPreviewImages.value = activityItem?.activity_files.map(
          (file: { url?: string; alt?: string; name?: string } | string) => ({
            url: typeof file === 'string' ? file : file.url || '',
            alt: typeof file === 'string' ? 'preview image' : file.alt || 'preview image',
            name:
              typeof file === 'string'
                ? `preview_${Date.now()}.png`
                : file.name || `preview_${Date.now()}.png`
          })
        )
      }

      // Get roster data from factory product
      // Assuming roster data might be stored in factory_product.roster_data or similar
      const factoryProduct = selectedFactoryProduct.value as
        | (FactoryProduct & {
            roster_data?: APCustomizationRosterEntry[]
            rosters?: Record<string, APCustomizationRosterEntry[]>
          })
        | undefined

      if (factoryProduct?.product_roster_detail) {
        rosterData.value = Array.isArray(factoryProduct.product_roster_detail)
          ? factoryProduct.product_roster_detail
          : []
      } else if (factoryProduct?.rosters) {
        // If rosters is an object with product IDs as keys
        const rosterEntries = Object.values(factoryProduct.rosters).flat()
        rosterData.value = rosterEntries.map(entry => ({
          size: entry.size || '',
          quantity: entry.quantity || 0,
          number: entry.number || '',
          text: entry.text || '',
          information: entry.information || ''
        }))
      } else {
        rosterData.value = []
      }

      showDetailDialog.value = true
    }
  }

  function showArtworkApproval() {
    showArtworkApprovalDialog.value = true
  }

  function showThirdPartyApproval() {
    showThirdPartyApprovalDialog.value = true
  }

  function handleArtworkApproved(updatedOrderItem: Item) {
    // Emit event to parent to update order
    emit('order-item-updated', updatedOrderItem)
  }

  function handleThirdPartySent(updatedOrderItem: Item) {
    // Emit event to parent to update order
    emit('order-item-updated', updatedOrderItem)
  }

  function handleEditProducts() {
    if (!order_item.value || !props.order || !status_activity.value) return

    const company = companyStore.company

    if (!company) {
      console.error('Company information not available')
      return
    }

    const customizerUrl = company.customizer_page_url
      ? `${company.company_domain}/${company.customizer_page_url}/#/?`
      : `${company.company_domain}/#/?`

    const redirectUrl = `${customizerUrl}order_id=${props.order.id}&order_item_id=${order_item.value.id}&order_item_status_activity_id=${status_activity.value.id}`

    window.location.href = redirectUrl
  }

  async function handleDownloadImages(
    images: Array<{ url: string; alt?: string; name?: string; ext?: string }>,
    contentIndex: number
  ) {
    if (!images || images.length === 0) return

    downloadingIndex.value = contentIndex

    try {
      // Prepare images with relative URLs (no storage prefix) and proper names
      const preparedImages = images.map(image => {
        // Keep relative URL as-is (API expects relative paths)
        const imageUrl = image.url || ''

        // Generate filename from URL if name is not provided
        const fileName =
          image.name || (image.url ? image.url.split('/').pop() || 'image.png' : 'image.png')

        return {
          url: imageUrl,
          name: fileName,
          alt: image.alt
        }
      })

      await downloadStatusActivityImages(preparedImages)
    } finally {
      downloadingIndex.value = null
    }
  }

  function handleReorder(contentIndex: number) {
    if (
      !order_item.value ||
      !props.order ||
      !order_item.value.factory_products ||
      contentIndex >= order_item.value.factory_products.length
    )
      return

    const reorderProduct = order_item.value.factory_products[contentIndex]
    if (!reorderProduct || !reorderProduct.product_id) {
      console.error('Product information not available for reorder')
      return
    }

    const company = companyStore.company

    if (!company) {
      console.error('Company information not available')
      return
    }

    const customizerUrl = company.customizer_page_url
      ? `${company.company_domain}/${company.customizer_page_url}/#/?`
      : `${company.company_domain}/#/?`

    let redirectUrl = `${customizerUrl}is_reorder=true&order_id=${props.order.id}&order_number=${props.order.order_no || ''}&order_item_id=${order_item.value.id}&`
    redirectUrl += `factory_product_id=${reorderProduct.id}&active_product_id=${reorderProduct.product_id}&`

    if (reorderProduct.style_id) {
      redirectUrl += `style_id=${reorderProduct.style_id}&`
    }
    if (reorderProduct.design_id) {
      redirectUrl += `design_id=${reorderProduct.design_id}`
    }

    window.location.href = redirectUrl
  }
</script>
