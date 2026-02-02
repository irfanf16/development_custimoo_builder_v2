<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Trash } from 'lucide-vue-next'
  import { ColorsPreview } from '@/components/ui/colors-preview'
  import type { CustomLogo } from '@/services/logos/types'
  import { computed } from 'vue'
  import { Badge } from '@/components/ui/badge'
  import { useCustomizationStore } from '@/stores/customization/customization.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import type { LogoColor } from '@/services/types'
  import {
    logos_uploaded_logo_alt,
    logos_apply_colors,
    logos_shuffle_colors,
    logos_no_colors_detected
  } from '@/paraglide/messages'

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()

  const props = defineProps<{
    logo: CustomLogo
  }>()

  const previewColors = computed(() => {
    const colors = props.logo.logo_colors || []
    return colors
      .map((c: LogoColor) => {
        if (Array.isArray(c)) {
          // RGB array from backend
          return `rgb(${c.join(',')})`
        }
        // Hex/pantone object from backend
        return c.hex || ''
      })
      .filter(Boolean)
  })

  // Check if default colors exist (have at least one color set)
  const hasDefaultColors = computed(() => {
    const defaultColors = customizationStore.customization?.default_colors || []
    return defaultColors.some((color: { color?: string | null }) => color.color)
  })

  const emit = defineEmits<{
    (e: 'click', logo: CustomLogo): void
    (e: 'delete', logo: CustomLogo): void
    (e: 'apply-colors', logo: CustomLogo): void
    (e: 'shuffle-colors'): void
  }>()
</script>
<template>
  <section
    :key="props.logo.id"
    class="relative group rounded-xl border border-border p-3 flex flex-col gap-3 bg-background cursor-pointer hover:bg-muted/50 transition-colors w-full"
    @click="emit('click', props.logo)"
  >
    <div class="flex flex-col items-center gap-3">
      <div class="w-24 h-24 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
        <img
          :src="baseStorageUrl + props.logo.url"
          class="max-h-full object-contain"
          :alt="logos_uploaded_logo_alt({}, { locale: profileStore.currentLocale })"
        />
      </div>
      <div
        v-if="props.logo.logo_colors && props.logo.logo_colors.length > 0"
        class="flex flex-row justify-between w-full items-center gap-2"
      >
        <ColorsPreview :colors="previewColors" />
        <div class="flex gap-2">
          <Button
            v-if="props.logo.logo_colors && props.logo.logo_colors.length > 0"
            size="sm"
            variant="default"
            @click.stop="emit('apply-colors', props.logo)"
          >
            {{ logos_apply_colors({}, { locale: profileStore.currentLocale }) }}
          </Button>
          <Button
            v-if="hasDefaultColors"
            size="sm"
            variant="outline"
            @click.stop="emit('shuffle-colors')"
          >
            {{ logos_shuffle_colors({}, { locale: profileStore.currentLocale }) }}
          </Button>
        </div>
      </div>
      <div v-else class="flex flex-row justify-between w-full">
        <div class="text-sm text-muted-foreground">
          {{ logos_no_colors_detected({}, { locale: profileStore.currentLocale }) }}
        </div>
      </div>
    </div>
    <Badge variant="outline" class="text-xs absolute top-1 left-1 bg-card">
      {{ props.logo.name_of_placement }}
    </Badge>
    <Button
      as="div"
      variant="ghost"
      size="icon"
      class="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-foreground"
      @click.stop="emit('delete', props.logo)"
    >
      <Trash class="size-4" />
    </Button>
  </section>
</template>
