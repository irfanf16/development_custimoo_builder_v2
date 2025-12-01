<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi
  } from '@/components/ui/carousel'
  import LazyTwoDScene from '@/components/customization-workflow/WorkflowSteps/LazyTwoDScene.vue'
  import Spinner from '../ui/spinner/Spinner.vue'
  import { CheckCircle2 } from 'lucide-vue-next'
  import { products_product_details } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import type {
    ActiveProductDetails,
    OutputDesignPreviewFront,
    OutputDesignPreviewBack
  } from '@/services/products/types'

  const profileStore = useProfileStore()
  const productsStore = useProductsStore()
  const { isLoading, fetchProductDetailsAndDesignsForProductPreview } = productsStore

  const productPreviewDetails = ref<{
    productDetails: ActiveProductDetails
    designDetails: (OutputDesignPreviewFront & OutputDesignPreviewBack)[]
  } | null>(null)

  const props = defineProps<{ open: boolean; productId: number }>()
  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
  }>()

  const CANVAS_DIMENSION = 400

  const designSlides = computed<(OutputDesignPreviewFront & OutputDesignPreviewBack)[]>(() => {
    return productPreviewDetails.value?.designDetails ?? []
  })
  const totalDesigns = computed(() => designSlides.value.length)
  const hasDesigns = computed(() => totalDesigns.value > 0)
  const hasMultipleDesigns = computed(() => totalDesigns.value > 1)

  const previewProductId = computed(
    () => productPreviewDetails.value?.productDetails?.productDetails?.id ?? null
  )

  const productTitle = computed(() => {
    const details = productPreviewDetails.value?.productDetails
    return details?.productDetails?.display_name || details?.styleDetails?.name || ''
  })

  const productDescription = computed(() => {
    const description =
      productPreviewDetails.value?.productDetails?.productDetails?.sku?.description
    return description?.trim() || 'Description will be available soon.'
  })

  const showBadge = computed(
    () => productPreviewDetails.value?.productDetails?.productDetails?.is_default === 1
  )

  const formattedPrice = computed(() => {
    const price =
      productPreviewDetails.value?.productDetails?.productDetails?.sku?.customized_sku_info
    if (typeof price === 'number' && !Number.isNaN(price)) {
      return new Intl.NumberFormat(profileStore.currentLocale ?? 'en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price)
    }
    return null
  })
  const priceText = computed(() => formattedPrice.value ?? 'Pricing available')
  const quantityText = computed(() => {
    const flexibleQuantity =
      productPreviewDetails.value?.productDetails?.productDetails?.allowed_logos_count
    if (typeof flexibleQuantity === 'number' && flexibleQuantity > 0) {
      return `for ${flexibleQuantity} pcs`
    }
    return 'Flexible order sizes'
  })

  const carouselApi = ref<CarouselApi | null>(null)
  const currentSlideIndex = ref(0)

  function updateSlidePosition(api?: CarouselApi | null) {
    if (!api) return
    currentSlideIndex.value = api.selectedScrollSnap() ?? 0
  }

  function handleCarouselInit(api: CarouselApi) {
    carouselApi.value = api
    updateSlidePosition(api)
    api?.on('select', () => updateSlidePosition(api))
    api?.on('reInit', () => updateSlidePosition(api))
  }

  watch(
    () => totalDesigns.value,
    length => {
      if (!length) {
        currentSlideIndex.value = 0
        return
      }
      nextTick(() => {
        carouselApi.value?.reInit?.()
        updateSlidePosition(carouselApi.value)
      })
    }
  )

  let fetchSequence = 0
  async function loadProductPreview(productId: number) {
    const sequence = ++fetchSequence
    if (productPreviewDetails.value?.productDetails?.productDetails?.id !== productId) {
      productPreviewDetails.value = null
    }
    const response = await fetchProductDetailsAndDesignsForProductPreview(productId)
    if (sequence !== fetchSequence) return
    if (response) {
      productPreviewDetails.value = response
    }
  }

  watch(
    () => [props.open, props.productId] as const,
    ([open, productId]) => {
      if (open && typeof productId === 'number') {
        void loadProductPreview(productId)
      }
    },
    { immediate: true }
  )

  const handleStartCustomization = () => {
    emit('update:open', false)
  }
</script>

<template>
  <Dialog :open="props.open" variant="large" @update:open="emit('update:open', $event)">
    <DialogContent variant="large">
      <DialogHeader>
        <DialogTitle>
          {{ products_product_details({}, { locale: profileStore.currentLocale }) }}
        </DialogTitle>
      </DialogHeader>

      <div class="relative flex flex-1 flex-col gap-6 overflow-hidden rounded-2xl bg-transparent">
        <div
          v-if="isLoading"
          class="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-sm"
        >
          <Spinner class="size-8 text-primary" />
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section class="relative overflow-hidden rounded-[32px] border bg-muted/10 p-4 sm:p-6">
            <div v-if="hasDesigns" class="relative">
              <Carousel
                class="w-full"
                :opts="{ align: 'center', loop: hasMultipleDesigns }"
                @init-api="handleCarouselInit"
              >
                <CarouselContent class="items-center">
                  <CarouselItem
                    v-for="design in designSlides"
                    :key="design.id"
                    class="flex justify-center px-2"
                  >
                    <LazyTwoDScene
                      :design="design.front_design"
                      :svg-parts="design.svg_parts"
                      :product-id="previewProductId ?? undefined"
                      :canvas-width="CANVAS_DIMENSION"
                      :canvas-height="CANVAS_DIMENSION"
                      :lazy="false"
                      canvas-class="rounded-[32px] shadow-lg"
                    />
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious
                  v-if="hasMultipleDesigns"
                  class="left-6 border-border bg-white/90 text-foreground shadow-lg hover:bg-white"
                />
                <CarouselNext
                  v-if="hasMultipleDesigns"
                  class="right-6 border-border bg-white/90 text-foreground shadow-lg hover:bg-white"
                />
              </Carousel>

              <div class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                <div
                  class="rounded-2xl border bg-background/90 px-6 py-3 text-sm shadow-lg backdrop-blur"
                  aria-live="polite"
                >
                  <div class="flex items-center gap-2 text-muted-foreground">
                    <span>Design</span>
                    <span class="text-xl font-semibold text-foreground">
                      {{ currentSlideIndex + 1 }}
                    </span>
                    <span>of</span>
                    <span class="text-xl font-semibold text-foreground">
                      {{ totalDesigns }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else-if="isLoading"
              class="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-muted-foreground/40 bg-muted/50"
            >
              <span class="text-sm text-muted-foreground">Loading design previews…</span>
            </div>
            <div
              v-else
              class="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-muted-foreground/40 bg-muted/30 p-6 text-center"
            >
              <p class="text-sm font-medium text-foreground">Design previews unavailable</p>
              <p class="text-sm text-muted-foreground">
                Try selecting another style to see available artwork.
              </p>
            </div>
          </section>

          <section class="rounded-2xl border bg-background/90 p-6 shadow-sm backdrop-blur">
            <template v-if="productPreviewDetails">
              <div class="flex flex-col gap-4">
                <Badge v-if="showBadge" class="w-fit shadow-sm">Most popular</Badge>
                <div class="space-y-2">
                  <p class="text-3xl font-semibold leading-tight text-foreground">
                    {{ productTitle }}
                  </p>
                  <p class="text-base leading-6 text-muted-foreground">
                    {{ productDescription }}
                  </p>
                </div>
              </div>

              <div class="flex items-baseline gap-2 text-2xl font-semibold text-foreground">
                <span>{{ priceText }}</span>
                <span class="text-base font-normal text-muted-foreground">{{ quantityText }}</span>
              </div>

              <Button class="h-10 w-full text-base font-medium" @click="handleStartCustomization">
                Customize now
              </Button>
            </template>
            <template v-else>
              <div class="space-y-3">
                <div class="h-5 w-28 animate-pulse rounded-full bg-muted" />
                <div class="h-8 w-3/4 animate-pulse rounded-full bg-muted" />
                <div class="h-14 w-full animate-pulse rounded-2xl bg-muted/80" />
              </div>

              <div class="mt-6 h-7 w-1/2 animate-pulse rounded-full bg-muted/70" />
              <div class="mt-4 h-10 w-full animate-pulse rounded-lg bg-muted/60" />
            </template>

            <div class="mt-6 flex items-start gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <div class="rounded-full bg-primary/15 p-2 text-primary">
                <CheckCircle2 class="size-5" aria-hidden="true" />
              </div>
              <div class="space-y-1 text-sm">
                <p class="font-medium text-foreground">All printing costs included!</p>
                <p class="text-muted-foreground">Logos, names, numbers & inscriptions</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
