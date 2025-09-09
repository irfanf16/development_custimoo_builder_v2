<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Ruler, Share2, FileText, RotateCcw } from 'lucide-vue-next'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useHistoryStore } from '@/stores/history/history.store'
  import {
    actions_size_guide,
    actions_reset_customization,
    actions_share_design,
    actions_generate_pdf
  } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'

  const customizationStore = useCustomizationStore()
  const history = useHistoryStore()
  const localeStore = useLocaleStore()

  function handleResetCustomization() {
    customizationStore.clearCustomization()
    history.clear()
  }
</script>

<template>
  <div class="flex items-center gap-2">
    <Button variant="outline" size="default" class="rounded-lg">
      <Ruler class="size-4" />
      {{ actions_size_guide({}, { locale: localeStore.currentLocale }) }}
    </Button>
    <Button
      variant="outline"
      size="default"
      class="rounded-lg"
      @click="handleResetCustomization"
    >
      <RotateCcw class="size-4" />
      {{
        actions_reset_customization({}, { locale: localeStore.currentLocale })
      }}
    </Button>
    <Button variant="outline" size="default" class="rounded-lg">
      <Share2 class="size-4" />
      {{ actions_share_design({}, { locale: localeStore.currentLocale }) }}
    </Button>
    <Button variant="outline" size="default" class="rounded-lg">
      <FileText class="size-4" />
      {{ actions_generate_pdf({}, { locale: localeStore.currentLocale }) }}
    </Button>
  </div>
</template>

<style scoped></style>
