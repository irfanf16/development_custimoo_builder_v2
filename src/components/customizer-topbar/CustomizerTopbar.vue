<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Save, ShoppingCart, RotateCcw } from 'lucide-vue-next'
  import ThemeToggle from '@/components/ThemeToggle.vue'
  // import SignInButton from '@/components/SignInButton.vue'
  import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
  import {
    topbar_save,
    topbar_locker_room,
    topbar_cart,
    topbar_save_options,
    actions_reset_customization
  } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'

  const customizationStore = useCustomizationStore()
  const history = useHistoryStore()

  function handleResetCustomization() {
    customizationStore.clearCustomization()
    history.clear()
  }

  const localeStore = useLocaleStore()
  const uiStore = useUIStore()
</script>

<template>
  <!-- Right aligned action group. Save is a split button to match figma. -->
  <div class="flex items-center gap-2">
    <Button
      variant="outline"
      size="default"
      class=""
      @click="handleResetCustomization"
    >
      <RotateCcw class="size-4" />
      {{
        actions_reset_customization({}, { locale: localeStore.currentLocale })
      }}
    </Button>
    <div class="flex rounded-md outline outline-border overflow-hidden">
      <Button variant="outline" size="default" class="rounded-none border-0">
        <Save class="size-4" />
        <span>{{
          topbar_save({}, { locale: localeStore.currentLocale })
        }}</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        class="rounded-none border-0 border-l outline-0"
        :aria-label="
          topbar_save_options({}, { locale: localeStore.currentLocale })
        "
      >
        <svg
          viewBox="0 0 24 24"
          class="size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Button>
    </div>

    <Button variant="outline" size="default" class="">
      <span>{{
        topbar_locker_room({}, { locale: localeStore.currentLocale })
      }}</span>
    </Button>
    <Button variant="outline" size="default" class="">
      <ShoppingCart class="size-4" />
      <span>{{ topbar_cart({}, { locale: localeStore.currentLocale }) }}</span>
    </Button>
    <LanguageSwitcher />
    <!-- <SignInButton variant="outline" size="default" class="" /> -->
    <ThemeToggle
      v-if="uiStore.allowColorModeSwitch"
      variant="outline"
      size="default"
      class=""
    />
  </div>
</template>

<style scoped></style>
