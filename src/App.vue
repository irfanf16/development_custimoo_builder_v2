<script setup lang="ts">
  import { computed, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import WidgetApp from '@/components/WidgetApp.vue'
  import { useAppInitialization } from '@/composables'
  import { Button } from '@/components/ui/button'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import { useAppStore } from '@/stores/app/app.store'
  import { useLocalStorage } from '@/composables/useLocalStorage'
  import { useCompanyStore } from '@/stores/company/company.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    applyBrandingSnapshotToWidgetRoot,
    readCompanyBrandingSnapshot
  } from '@/lib/companyBrandingStorage'
  import { applyCompanyUiBrandingTheme } from '@/lib/companyUiBrandingTheme'
  import { preloadUiBrandingFonts } from '@/lib/preloadUiBrandingFonts'
  import { resolveWidgetBrandingRoot } from '@/lib/widgetUtils'
  import { app_initializing, app_initializing_retry } from '@/paraglide/messages'

  const route = useRoute()
  const profileStore = useProfileStore()
  const { currentLocale } = storeToRefs(profileStore)
  const companyStore = useCompanyStore()

  const initType = computed(() => route.meta?.intitializationType as string | undefined)

  if (initType.value !== 'third-party-approval') {
    useAppStore().loadAppInfoFromGlobalVariable()
    const storage = useLocalStorage()
    const cached = readCompanyBrandingSnapshot(storage)
    if (cached?.settings?.ui_branding) {
      companyStore.hydrateBrandingSnapshot(cached)
      applyBrandingSnapshotToWidgetRoot(storage, cached)
    }
  }

  function applyBrandingToWidgetRootFromStore(): void {
    const ui = companyStore.settings?.ui_branding
    const root = resolveWidgetBrandingRoot()
    if (ui && root) {
      applyCompanyUiBrandingTheme(root, ui)
      void preloadUiBrandingFonts(ui)
    }
  }

  watch(
    () => companyStore.settings?.ui_branding,
    () => applyBrandingToWidgetRootFromStore(),
    { deep: true, immediate: true }
  )

  const appInit = initType.value === 'third-party-approval' ? null : useAppInitialization()
  const isLoading = computed(() => appInit?.isLoading.value ?? false)
  const error = computed(() => appInit?.error.value ?? null)

  const initializingLabel = computed(() =>
    app_initializing({}, { locale: currentLocale.value || 'en' })
  )
  const retryLabel = computed(() =>
    app_initializing_retry({}, { locale: currentLocale.value || 'en' })
  )
</script>

<template>
  <div
    v-if="isLoading"
    class="flex min-h-screen items-center justify-center font-sans text-primary"
  >
    <div class="flex flex-col items-center gap-3 text-center">
      <Spinner class="size-8 text-primary" />
      <p class="text-sm font-medium">{{ initializingLabel }}</p>
    </div>
  </div>

  <div v-else-if="error" class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <p class="mb-4 text-destructive">{{ error }}</p>
      <Button v-if="appInit" variant="default" class="px-4 py-2" @click="appInit.initializeApp()">
        {{ retryLabel }}
      </Button>
    </div>
  </div>

  <WidgetApp v-else v-bind="$attrs" />
</template>
