<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { Button } from '@/components/ui/button'
  import { ShoppingCart, User, Package, Home, Download, FileDown } from 'lucide-vue-next'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { useCartStore } from '@/stores/cart/cart.store'
  import { useSignIn } from '@/composables/useSignIn'
  import { usePendingPostLoginAction } from '@/composables/usePendingPostLoginAction'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { API } from '@/services'
  import type { CollectionImageAdminItem } from '@/services/company/types'
  import type {
    CollectionWithProducts,
    CollectionProductWithLockerRoom
  } from '@/services/lockers/types'
  import ProfileDialog from '@/components/customizer-profile-section/ProfileDialog.vue'
  import SignInDialog from '@/components/auth/SignInDialog.vue'
  import { CartDialog } from '@/components/cart'
  import SaveDesignDialog from '@/components/SaveDesignDialog.vue'
  import { PLACEHOLDER_IMAGE } from '@/helpers/imageHelper'
  import { downloadFromUrl } from '@/lib/utils'
  import { toast } from 'vue-sonner'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    msg_failed_to_add_to_cart,
    msg_locker_cart_single_unavailable,
    msg_locker_cart_partial_added
  } from '@/paraglide/messages'

  const route = useRoute()
  const router = useRouter()
  const companyStore = useCompanyStore()
  const authStore = useAuthStore()
  const cartStore = useCartStore()
  const uiStore = useUIStore()
  const { openSignInDialog } = useSignIn()
  const {
    setPending,
    getPending,
    getPendingSaveToLockerProduct,
    getPendingAddToCartProduct,
    clearPending
  } = usePendingPostLoginAction()

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const isLoggedIn = computed(() => authStore.isAuthenticated)
  const storageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')

  // Extract collection file name from slug: "test_1772481966" -> "1772481966"
  const collectionFileName = computed(() => {
    const slug = (route.params.collectionSlug as string) || ''
    // const lastUnderscore = slug.lastIndexOf('_')
    // return lastUnderscore >= 0 ? slug.slice(lastUnderscore + 1) :
    return slug
  })

  // Header dialogs
  const showCartDialog = ref(false)
  const showProfileDialog = ref(false)
  const showOrdersProfileDialog = ref(false)

  // Collection data
  const collection = ref<CollectionWithProducts | null>(null)
  const collectionLoading = ref(false)
  const collectionError = ref<string | null>(null)

  // Hero: parsed collection_image_admin
  const heroImages = computed((): CollectionImageAdminItem[] => {
    const raw = companyStore.settings?.settings?.collection_image_admin
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    try {
      const parsed = JSON.parse(raw as string) as CollectionImageAdminItem[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  const primaryHeroImage = computed(
    () => heroImages.value.find(i => i.index === 0) ?? heroImages.value[0]
  )
  const heroFallbackImages = computed(() =>
    heroImages.value.filter((_, idx) => idx > 0).sort((a, b) => a.index - b.index)
  )

  const heroImageUrl = (item: CollectionImageAdminItem) => {
    const url = item.img_url
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${storageUrl.value}${url}`
  }

  // Ensure settings are loaded
  onMounted(async () => {
    if (!companyStore.settings) {
      await companyStore.fetchSettings()
    }
    await fetchCollection()
  })

  watch(
    () => route.params.collectionSlug,
    () => fetchCollection()
  )

  async function fetchCollection() {
    const fileName = collectionFileName.value
    if (!fileName) {
      collectionError.value = 'Invalid collection'
      return
    }
    collectionLoading.value = true
    collectionError.value = null
    try {
      const res = await API.lockers.getCollectionByFileName(fileName)
      if (res.data?.success && res.data?.result?.collection) {
        collection.value = res.data.result.collection
      } else {
        collectionError.value = res.data?.message || 'Failed to load collection'
      }
    } catch (e) {
      collectionError.value = 'Failed to load collection'
      console.error(e)
    } finally {
      collectionLoading.value = false
    }
  }

  // Product card: image URLs from locker_product_images_folder (convention: front.png, back.png)
  function productImageUrl(
    plr: CollectionProductWithLockerRoom['product_locker_room'],
    side: 'front' | 'back'
  ) {
    if (plr[`${side}_image`]) {
      return `${storageUrl.value}${plr[`${side}_image`]}`
    }
    const folder = plr.locker_product_images_folder
    if (!folder) return PLACEHOLDER_IMAGE
    const base = folder.startsWith('http') ? folder : `${storageUrl.value}${folder}`
    const sep = base.endsWith('/') ? '' : '/'
    return `${base}${sep}${side}.png`
  }

  function productDescription(plr: CollectionProductWithLockerRoom['product_locker_room']): string {
    const desc = plr.product?.sku?.description
    if (!desc || typeof desc !== 'string') return ''
    return desc.replace(/<[^>]+>/g, '').trim()
  }

  /** When unset, show prices (same intent as cart when merchants enable collection price + allow_price). */
  const showProductPricing = computed(() => {
    const v = companyStore.settings?.settings?.currencies?.visible
    return v !== false
  })

  function formatCollectionProductPrice(cp: CollectionProductWithLockerRoom): string | null {
    if (!cp.allow_price) return null
    const raw = String(cp.product_price ?? '').trim()
    if (!raw) return null
    const num = parseFloat(raw.replace(/[^0-9.-]/g, ''))
    if (!Number.isFinite(num)) return raw
    const cur = companyStore.settings?.settings?.currencies
    const list = cur?.currenncies ?? cur?.currencies
    const code =
      companyStore.localization?.currency?.code ||
      (Array.isArray(list) && list.length ? list[0] : null) ||
      'USD'
    try {
      return new Intl.NumberFormat(locale.value, {
        style: 'currency',
        currency: code
      }).format(num)
    } catch {
      return raw
    }
  }

  // Purchase: add locker product to cart (or save as pending if guest)
  async function handlePurchase(cp: CollectionProductWithLockerRoom) {
    if (!isLoggedIn.value) {
      setPending('addToCart', cp)
      openSignInDialog()
      return
    }
    const plr = cp.product_locker_room
    const roomId = plr.room_id
    const productId = plr.id
    try {
      const r = await cartStore.addLockerProductsToCart({
        locker_products: { [roomId]: [productId] },
        lockers: [],
        collection_id: collection.value?.id
      })
      if (r.ok) {
        if (r.outcome === 'partial') {
          toast.warning(
            msg_locker_cart_partial_added(
              { skipped: String(r.skippedCount), added: String(r.addedCount) },
              { locale: locale.value }
            )
          )
        }
        showCartDialog.value = true
      } else {
        toast.error(msg_locker_cart_single_unavailable({}, { locale: locale.value }))
      }
    } catch (e) {
      console.error(e)
      toast.error(msg_failed_to_add_to_cart({}, { locale: locale.value }))
    }
  }

  // Save to Locker: guest -> sign in then open save dialog; logged in -> open save dialog with product
  function handleSaveToLocker(cp: CollectionProductWithLockerRoom) {
    if (isLoggedIn.value) {
      uiStore.setSaveDesignDialogCollectionProduct(cp)
      uiStore.openSaveDesignDialog()
    } else {
      setPending('saveToLocker', cp)
      openSignInDialog()
    }
  }

  async function onLoginSuccess() {
    const pending = getPending()
    if (pending === 'saveToLocker') {
      const product = getPendingSaveToLockerProduct()
      if (product) {
        uiStore.setSaveDesignDialogCollectionProduct(product)
        clearPending()
        uiStore.openSaveDesignDialog()
      }
      return
    }
    if (pending === 'addToCart') {
      const product = getPendingAddToCartProduct()
      if (product) {
        const plr = product.product_locker_room
        const roomId = plr.room_id
        const productId = plr.id
        try {
          const r = await cartStore.addLockerProductsToCart({
            locker_products: { [roomId]: [productId] },
            lockers: [],
            collection_id: collection.value?.id
          })
          if (r.ok) {
            if (r.outcome === 'partial') {
              toast.warning(
                msg_locker_cart_partial_added(
                  { skipped: String(r.skippedCount), added: String(r.addedCount) },
                  { locale: locale.value }
                )
              )
            }
            clearPending()
            showCartDialog.value = true
          } else {
            toast.error(msg_locker_cart_single_unavailable({}, { locale: locale.value }))
          }
        } catch (e) {
          console.error(e)
          toast.error(msg_failed_to_add_to_cart({}, { locale: locale.value }))
        }
      }
    }
  }

  function onSaveDesignDialogClose(open: boolean) {
    if (!open) uiStore.setSaveDesignDialogCollectionProduct(null)
  }

  function downloadPdf() {
    const c = collection.value
    if (!c?.pdf_link) return
    const path = c.pdf_link
    const url =
      path.startsWith('http://') || path.startsWith('https://')
        ? path
        : `${storageUrl.value.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
    const filename = c.file_name ? `${c.file_name}.pdf` : `collection-${c.id}.pdf`
    downloadFromUrl(url, filename)
  }

  function downloadImage(url: string, filename: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'image.png'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
</script>

<template>
  <div id="collection-view-container" data-testid="collection-root" class="min-h-screen flex flex-col bg-background">
    <!-- Header -->
    <header
      class="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="container flex h-14 items-center justify-between gap-2 px-4">
        <Button variant="ghost" size="icon" aria-label="Home" @click="router.push('/')">
          <Home class="h-5 w-5" />
        </Button>
        <div v-if="collection?.pdf_link || isLoggedIn" class="flex items-center gap-2">
          <Button
            v-if="collection?.pdf_link"
            variant="ghost"
            size="icon"
            aria-label="Download PDF"
            @click="downloadPdf"
          >
            <FileDown class="h-5 w-5" />
          </Button>
          <Button
            v-if="isLoggedIn"
            variant="ghost"
            size="icon"
            aria-label="Cart"
            @click="showCartDialog = true"
          >
            <ShoppingCart class="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Profile"
            @click="showProfileDialog = true"
          >
            <User class="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Orders"
            @click="showOrdersProfileDialog = true"
          >
            <Package class="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section
      v-if="primaryHeroImage"
      class="relative w-full overflow-hidden bg-muted"
      :style="{
        minHeight: primaryHeroImage.full_width ? '280px' : '200px',
        height: primaryHeroImage.full_width ? '100vh' : '200px',
        backgroundColor: primaryHeroImage.full_width ? undefined : 'var(--muted)'
      }"
    >
      <h1
        v-if="collection?.name"
        class="absolute top-4 left-1/2 z-10 -translate-x-1/2 text-5xl font-bold text-black"
        style="
          -webkit-text-stroke: 2px white;
          text-shadow:
            0 0 2px white,
            0 0 4px white;
        "
      >
        {{ collection.name }}
      </h1>
      <template v-if="primaryHeroImage.full_width">
        <img
          :src="heroImageUrl(primaryHeroImage)"
          :alt="'Hero'"
          class="absolute inset-0 h-full w-full object-cover object-center"
          @error="
            (e: Event) => {
              const target = e.target as HTMLImageElement
              const next = heroFallbackImages.find(() => true)
              if (next) target.src = heroImageUrl(next)
              else target.src = PLACEHOLDER_IMAGE
            }
          "
        />
      </template>
      <template v-else>
        <img
          :src="heroImageUrl(primaryHeroImage)"
          :alt="'Hero'"
          class="relative z-10 mx-auto max-h-full object-contain"
          :style="{
            width: primaryHeroImage.dimension?.width
              ? `${primaryHeroImage.dimension.width}px`
              : 'auto',
            height: primaryHeroImage.dimension?.height
              ? `${primaryHeroImage.dimension.height}px`
              : '200px'
          }"
          @error="
            (e: Event) => {
              const target = e.target as HTMLImageElement
              const next = heroFallbackImages.find(() => true)
              if (next) target.src = heroImageUrl(next)
              else target.src = PLACEHOLDER_IMAGE
            }
          "
        />
      </template>
    </section>

    <!-- Products -->
    <main class="flex-1 px-4 py-8">
      <div v-if="collectionLoading" class="flex justify-center py-12">
        <span class="text-muted-foreground">Loading collection…</span>
      </div>
      <div v-else-if="collectionError" class="py-12 text-center text-destructive">
        {{ collectionError }}
      </div>
      <div
        v-else-if="collection?.collection_products?.length"
        class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <article
          v-for="cp in collection.collection_products"
          :key="cp.id"
          class="flex flex-col rounded-lg border bg-card p-4 shadow-sm"
        >
          <div class="flex gap-2 overflow-hidden rounded-md bg-muted">
            <div class="group relative flex-1 min-h-[140px] flex items-center justify-center p-2">
              <img
                :src="productImageUrl(cp.product_locker_room, 'front')"
                :alt="cp.product_nickname"
                class="max-h-[160px] w-auto object-contain"
                @error="
                  (e: Event) => {
                    ;(e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                  }
                "
              />
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Download front"
                  @click.stop="
                    downloadImage(
                      productImageUrl(cp.product_locker_room, 'front'),
                      `${cp.product_nickname || cp.product_locker_room.product_name}-front.png`
                    )
                  "
                >
                  <Download class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div class="group relative flex-1 min-h-[140px] flex items-center justify-center p-2">
              <img
                :src="productImageUrl(cp.product_locker_room, 'back')"
                :alt="`${cp.product_nickname} back`"
                class="max-h-[160px] w-auto object-contain"
                @error="
                  (e: Event) => {
                    ;(e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                  }
                "
              />
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Download back"
                  @click.stop="
                    downloadImage(
                      productImageUrl(cp.product_locker_room, 'back'),
                      `${cp.product_nickname || cp.product_locker_room.product_name}-back.png`
                    )
                  "
                >
                  <Download class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div class="mt-3 flex-1">
            <h3 class="font-semibold">
              {{ cp.product_nickname || cp.product_locker_room.product_name }}
            </h3>
            <p class="mt-1 text-sm text-muted-foreground line-clamp-3">
              {{ cp.product_note || productDescription(cp.product_locker_room) }}
            </p>
            <p
              v-if="showProductPricing && formatCollectionProductPrice(cp)"
              class="mt-2 text-lg font-semibold text-foreground"
            >
              {{ formatCollectionProductPrice(cp) }}
            </p>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <Button class="flex-1" @click="handlePurchase(cp)"> Purchase </Button>
            <Button variant="outline" class="flex-1" @click="handleSaveToLocker(cp)">
              Save To Locker
            </Button>
          </div>
        </article>
      </div>
      <div
        v-else-if="collection && !collection.collection_products?.length"
        class="py-12 text-center text-muted-foreground"
      >
        No products in this collection.
      </div>
    </main>

    <!-- Dialogs -->
    <SignInDialog @success="onLoginSuccess" />
    <CartDialog v-if="isLoggedIn" :open="showCartDialog" @update:open="showCartDialog = $event" />
    <SaveDesignDialog
      :open="uiStore.showSaveDesignDialog"
      @update:open="
        (v: boolean) => {
          if (!v) uiStore.closeSaveDesignDialog()
          onSaveDesignDialogClose(v)
        }
      "
    />
    <ProfileDialog :open="showProfileDialog" @update:open="showProfileDialog = $event" />
    <ProfileDialog
      :open="showOrdersProfileDialog"
      :initial-tab="'orders'"
      @update:open="showOrdersProfileDialog = $event"
    />
  </div>
</template>
