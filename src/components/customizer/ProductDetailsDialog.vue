<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  import { products_product_details } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useProductsStore } from '@/stores/products/products.store'
  import type {
    OutputDesignPreviewFront,
    OutputDesignPreviewBack,
    OutputProductDetails,
    OutputStyleDetails,
    OutputDesignDetails
  } from '@/services/products/types'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { storeToRefs } from 'pinia'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'

  const uiStore = useUIStore()
  const { isMobile } = storeToRefs(uiStore)
  const profileStore = useProfileStore()
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const workflowStore = useWorkflowStore()
  const { shouldShowStyles } = useCustomizerMenu()
  const { isLoading, fetchProductDetailsAndDesignsForProductPreview } = productsStore

  const productPreviewDetails = ref<{
    productDetails: OutputProductDetails
    styleDetails: OutputStyleDetails
    defaultDesignDetails: OutputDesignDetails
    designPreviews: (OutputDesignPreviewFront & OutputDesignPreviewBack)[]
  } | null>(null)

  const props = defineProps<{ open: boolean; productId: number }>()
  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
  }>()

  const CANVAS_DIMENSION = computed(() => (isMobile.value ? 400 : 540))

  const designSlides = computed<(OutputDesignPreviewFront & OutputDesignPreviewBack)[]>(() => {
    return productPreviewDetails.value?.designPreviews ?? []
  })
  const totalDesigns = computed(() => designSlides.value.length)
  const hasDesigns = computed(() => totalDesigns.value > 0)
  const hasMultipleDesigns = computed(() => totalDesigns.value > 1)

  const previewProductId = computed(() => productPreviewDetails.value?.productDetails?.id ?? null)

  const productTitle = computed(() => {
    return (
      productPreviewDetails.value?.productDetails?.sku?.sku_id ??
      productPreviewDetails.value?.productDetails?.display_name
    )
  })

  const productDescription = computed(() => {
    const description = productPreviewDetails.value?.productDetails?.sku?.description
    return description?.trim() || 'Description will be available soon.'
  })

  // const showBadge = computed(
  //   () => productPreviewDetails.value?.productDetails?.productDetails?.is_default === 1
  // )

  const formattedPrice = computed(() => {
    const price = productPreviewDetails.value?.productDetails?.sku?.customized_sku_info
    if (typeof price === 'number' && !Number.isNaN(price)) {
      return new Intl.NumberFormat(profileStore.currentLocale ?? 'en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price)
    }
    return null
  })
  const priceText = computed(() => formattedPrice.value ?? 'PRICING TBD')
  const quantityText = computed(() => {
    const flexibleQuantity = productPreviewDetails.value?.productDetails?.allowed_logos_count
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
    // if (productPreviewDetails.value?.productDetails?.id !== productId) {
    //   productPreviewDetails.value = null
    // }
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

  const handleStartCustomization = async () => {
    if (!productPreviewDetails.value) return
    const { productDetails, styleDetails, defaultDesignDetails, designPreviews } =
      productPreviewDetails.value
    const productId = productDetails.id
    const selectedDesignPreview = designSlides.value[currentSlideIndex.value] ?? null

    try {
      workflowStore.commitSelectedCategory()
      workflowStore.commitSelectedSubCategory()

      if (!customizationStore.customization) {
        customizationStore.ensureCustomization({
          productId,
          styleId: styleDetails?.id,
          designId: (selectedDesignPreview ?? defaultDesignDetails)?.id
        })
      }

      customizationStore.setProduct(productId)
      productsStore.setActiveProductDetailsState(productDetails)

      if (productDetails.product_texts?.length) {
        customizationStore.initializeProductTextsFromDetails(
          productId,
          productDetails.product_texts
        )
      }

      if (styleDetails) {
        productsStore.setActiveStyleDetailsState(styleDetails)
        customizationStore.setStyle(styleDetails.id)
      }

      if (defaultDesignDetails) {
        productsStore.setActiveDesignDetailsState(defaultDesignDetails)
      }

      if (designPreviews?.length) {
        productsStore.designPreviews = designPreviews
      }

      const designToApply = selectedDesignPreview ?? defaultDesignDetails
      if (designToApply) {
        productsStore.applyDesignPreview(designToApply)
      }

      await productsStore.fetchStylePreviews(productId)
      if ((!designPreviews || !designPreviews.length) && styleDetails) {
        await productsStore.fetchDesignPreviewsByStyleId(styleDetails.id)
      }

      if (shouldShowStyles.value) {
        workflowStore.setActiveStep('styles')
      } else {
        workflowStore.setActiveStep('logos')
      }
      workflowStore.resetWorkflowSubSteps()

      emit('update:open', false)
    } catch (error) {
      console.error('Error starting customization from dialog:', error)
    }
  }
</script>

<template>
  <Dialog :open="props.open" variant="large" @update:open="emit('update:open', $event)">
    <DialogContent variant="large" class="md:max-h-[742px] flex flex-col">
      <DialogHeader>
        <DialogTitle>
          {{ products_product_details({}, { locale: profileStore.currentLocale }) }}
        </DialogTitle>
      </DialogHeader>

      <div
        v-if="isLoading"
        class="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-sm"
      >
        <Spinner class="size-8 text-primary" />
      </div>

      <div class="flex flex-row gap-6 h-full">
        <section class="rounded-2xl border bg-background p-4 sm:p-6 md:w-[640px]">
          <div class="h-full w-full flex flex-col justify-center items-center">
            <div v-if="hasDesigns" class="relative overflow-hidden w-full">
              <Carousel
                class=""
                :opts="{ align: 'center', loop: false }"
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
                      canvas-class="h-full w-full"
                    />
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious
                  v-if="hasMultipleDesigns"
                  class="left-6 border rounded-md bg-white/90 text-foreground shadow-none hover:bg-white"
                />
                <CarouselNext
                  v-if="hasMultipleDesigns"
                  class="right-6 border rounded-md bg-white/90 text-foreground shadow-none hover:bg-white"
                />
              </Carousel>

              <div class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                <div
                  class="p-1 rounded-2xl backdrop-blur-sm bg-white/20 cursor-pointer w-fit h-fit"
                >
                  <div
                    class="rounded-2xl border bg-background/90 px-6 py-3 text-sm shadow-lg backdrop-blur"
                    aria-live="polite"
                  >
                    <div class="flex items-center gap-1 text-muted-foreground">
                      <span class="text-base">Design</span>
                      <span class="text-xl font-semibold text-foreground">
                        {{ currentSlideIndex + 1 }}
                      </span>
                      <span class="text-base">of</span>
                      <span class="text-xl font-semibold text-foreground">
                        {{ totalDesigns }}
                      </span>
                    </div>
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
          </div>
        </section>

        <section class="flex flex-col max-w-[480px] gap-4 md:gap-6">
          <template v-if="productPreviewDetails">
            <div class="flex flex-col gap-2">
              <!-- <Badge v-if="showBadge" class="w-fit shadow-sm">Most popular</Badge> -->
              <p class="text-3xl font-semibold leading-tight text-foreground">
                {{ productTitle }}
              </p>
              <p class="text-base leading-6 text-muted-foreground" v-html="productDescription"></p>
            </div>

            <div class="flex items-baseline gap-2 text-2xl font-semibold text-foreground">
              <span>{{ priceText }}</span>
              <span class="text-base font-normal text-muted-foreground">{{ quantityText }}</span>
            </div>

            <Button variant="primary" @click="handleStartCustomization"> Customize now </Button>
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

          <div class="mt-6 flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
            <i-other-warranty-badge-highlight
              class="size-[2.625rem] text-primary"
              aria-hidden="true"
            />
            <div class="space-y-1 text-sm">
              <p class="font-medium text-foreground">All printing costs included!</p>
              <p class="text-muted-foreground">Logos, names, numbers & inscriptions</p>
            </div>
          </div>
        </section>
      </div>
    </DialogContent>
  </Dialog>
</template>
