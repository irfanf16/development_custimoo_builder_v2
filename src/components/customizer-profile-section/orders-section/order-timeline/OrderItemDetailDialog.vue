<template>
  <Dialog v-model:open="isOpen">
    <DialogContent variant="large" class="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-xl font-bold text-foreground">Order Details</DialogTitle>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Order Information Section -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border"
        >
          <div class="flex flex-col gap-2 text-sm">
            <div v-if="order?.company_id" class="text-muted-foreground">
              <span class="font-semibold">Company:</span>
              <span class="ml-2">{{ order.company_name || 'N/A' }}</span>
            </div>
            <div v-if="order?.customer" class="text-muted-foreground">
              <span class="font-semibold">Customer:</span>
              <span class="ml-2"
                >{{ order?.customer.first_name }} {{ order?.customer.last_name }}</span
              >
            </div>
            <div v-if="order?.customer.email" class="text-muted-foreground">
              <span class="font-semibold">Email:</span>
              <span class="ml-2">{{ order?.customer.email }}</span>
            </div>
            <div v-if="factoryProduct?.product_name" class="text-muted-foreground">
              <span class="font-semibold">Product:</span>
              <span class="ml-2">{{ factoryProduct.product_name }}</span>
            </div>
          </div>
          <div class="flex flex-shrink-0 gap-2">
            <button
              v-if="
                order?.design_file &&
                order?.additional_fields &&
                !order?.additional_fields.is_manual_order
              "
              class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              @click="handleDownloadPdf"
            >
              Download PDF
            </button>
            <a
              :href="excelDownloadUrl"
              :download="excelFileName"
              class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Download Excel
            </a>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column - Roster Detail -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-foreground">Roster Detail</h3>
            <div class="border border-border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="bg-muted border-b border-border">
                      <th
                        class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase"
                      >
                        Size
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase"
                      >
                        Quantity
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase"
                      >
                        Number
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase"
                      >
                        Text
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(roster, index) in rosterData"
                      :key="index"
                      class="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <td class="px-4 py-3 text-sm text-foreground">{{ roster.size || 'N/A' }}</td>
                      <td class="px-4 py-3 text-sm text-foreground">
                        {{ roster.quantity || 'N/A' }}
                      </td>
                      <td class="px-4 py-3 text-sm text-foreground">
                        {{ roster.number || 'N/A' }}
                      </td>
                      <td class="px-4 py-3 text-sm text-foreground">{{ roster.text || 'N/A' }}</td>
                    </tr>
                    <tr v-if="!rosterData || rosterData.length === 0">
                      <td colspan="4" class="px-4 py-8 text-center text-sm text-muted-foreground">
                        No roster data available
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Right Column - Production Image -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-foreground">Production Image</h3>
            <div class="border border-border rounded-lg p-4 bg-card">
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div
                  v-for="(image, index) in previewImages"
                  :key="index"
                  class="flex items-center justify-center bg-muted rounded-lg overflow-hidden aspect-square"
                >
                  <img
                    :src="image.url ? `${storageUrl}${image.url}` : placeholderImage"
                    :alt="image.alt || `Preview image ${index + 1}`"
                    class="object-contain w-full h-full"
                    @error="onImageError"
                  />
                </div>
                <div
                  v-if="previewImages.length === 0"
                  class="col-span-2 flex items-center justify-center bg-muted rounded-lg aspect-square"
                >
                  <span class="text-sm text-muted-foreground">No preview images available</span>
                </div>
              </div>
              <button
                class="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!previewImages || previewImages.length === 0"
                @click="downloadPreviewImages"
              >
                Download Preview Images
              </button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useVModel } from '@vueuse/core'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import type { FactoryProduct, Order } from '@/services/orders/types'
  import type { APCustomizationRosterEntry } from '@/services/products/types/customization'
  import { PLACEHOLDER_IMAGE, onImageError } from '@/helpers/imageHelper'
  import { useTryCatchApi } from '@/composables/useTryCatchApi'
  import { API } from '@/services'

  const { tryCatchApi } = useTryCatchApi({
    defaultProperties: { component: 'OrderItemDetailDialog' }
  })

  interface Props {
    open?: boolean
    order?: Order
    factoryProduct?: FactoryProduct
    rosterData?: APCustomizationRosterEntry[]
    previewImages?: Array<{ url: string; alt?: string; name?: string }>
    orderId?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    order: undefined,
    factoryProduct: undefined,
    customer: undefined,
    email: undefined,
    rosterData: () => [],
    previewImages: () => [],
    orderId: undefined
  })

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
  }>()

  const isOpen = useVModel(props, 'open', emit, { passive: true, defaultValue: false })
  const storageUrl = import.meta.env.VITE_APP_STORAGE_URL
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT || ''
  const placeholderImage = PLACEHOLDER_IMAGE

  const excelDownloadUrl = computed(() => {
    if (!props.orderId || !props.factoryProduct?.id) return '#'
    // Use the API endpoint with the export path
    return `${apiEndpoint}/api/order/${props.orderId}/product/${props.factoryProduct.id}/export`
  })

  const excelFileName = computed(() => {
    if (!props.order || !props.factoryProduct) return 'order_export.xlsx'
    const orderNo = props.order.order_no || getCurrentDatetime()
    const productName = props.factoryProduct.product_name || 'product'
    return `order_${orderNo}_product_${productName}.xlsx`
  })

  function getCurrentDatetime(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    return `${year}${month}${day}_${hours}${minutes}${seconds}`
  }

  async function downloadPreviewImages() {
    if (!props.previewImages || props.previewImages.length === 0) return

    try {
      // Convert URLs to base64 and download
      const base64Files = await Promise.all(
        props.previewImages.map(async image => {
          const imageUrl = image.url.startsWith('http') ? image.url : `${storageUrl}${image.url}`
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        })
      )

      // Create download links for each image
      base64Files.forEach((base64File, index) => {
        const link = document.createElement('a')
        link.href = base64File
        link.download = props.previewImages[index]?.name || `preview_image_${index + 1}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    } catch (error) {
      console.error('Error downloading preview images:', error)
    }
  }

  async function handleDownloadPdf() {
    if (!props.order?.id) return

    const response = await tryCatchApi(API.orders.getDesignFileUrl(props.order.id), {
      operation: 'handleDownloadPdf',
      order_id: props.order.id
    })
    if (response.success && response.content?.result?.url) {
      window.open(response.content.result.url, '_blank')
    } else if (!response.success) {
      console.error('Error fetching the PDF URL:', response.axiosError)
    }
  }
</script>
