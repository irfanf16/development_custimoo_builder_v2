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
    logos_use_original,
    logos_no_colors_detected
  } from '@/paraglide/messages'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()
  const workflowStore = useWorkflowStore()

  const props = withDefaults(
    defineProps<{
      logo: CustomLogo
      index: number
      /** Enable clicking detected colors (e.g. open Logos Color panel in editor). */
      interactiveLogoColors?: boolean
      /** Highlight a swatch (e.g. matches open Logos Color panel selection). */
      highlightedLogoColorIndex?: number | null
    }>(),
    {
      interactiveLogoColors: false,
      highlightedLogoColorIndex: null
    }
  )

  const previewColors = computed(() => {
    const colors = props.logo.logo_colors || []
    // Preserve indices for interactive swatch clicks (do not filter entries out).
    return colors.map((c: LogoColor) => {
      if (Array.isArray(c)) {
        return `rgb(${c.join(',')})`
      }
      return c.hex || 'rgba(0,0,0,0.12)'
    })
  })

  // Check if default colors exist (have at least one color set)
  const hasDefaultColors = computed(() => {
    const defaultColors = customizationStore.customization?.default_colors || []
    return defaultColors.some((color: { color?: string | null }) => color.color)
  })

  const customLogosForProduct = computed((): CustomLogo[] => {
    const pid = customizationStore.customization?.product_id
    const map = customizationStore.customization?.custom_logos
    if (pid == null || !map) return []
    return (map as Record<string, CustomLogo[]>)[String(pid)] ?? []
  })

  /** Which list row had "Apply colors" used (multiple placements can share the same customer logo id). */
  const isThisLogoColorsApplied = computed(() => {
    if (!hasDefaultColors.value) return false
    const appliedId = workflowStore.activeLogoId
    if (appliedId == null || appliedId === '') return false
    if (String(props.logo.id) !== String(appliedId)) return false
    const pinned = workflowStore.logoApplySourceIndex
    if (pinned != null) {
      return pinned === props.index
    }
    const firstIdx = customLogosForProduct.value.findIndex(l => String(l.id) === String(appliedId))
    return firstIdx === props.index
  })

  const emit = defineEmits<{
    (e: 'click', index: number): void
    (e: 'delete', logo: CustomLogo): void
    (e: 'apply-colors', logo: CustomLogo): void
    (e: 'shuffle-colors', logo: CustomLogo): void
    (e: 'use-original-and-proceed'): void
    (e: 'logo-color-click', index: number): void
  }>()
</script>
<template>
  <section
    class="relative group rounded-xl border border-border p-3 flex flex-col gap-3 bg-background cursor-pointer hover:bg-muted/50 transition-colors w-full"
    @click="emit('click', props.index)"
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
        class="flex w-full min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
      >
        <!-- Swatches stay left on all breakpoints (main layout); interactive swatches from feature branch -->
        <ColorsPreview
          class="shrink-0 self-start"
          :colors="previewColors"
          :interactive="props.interactiveLogoColors"
          :selected-swatch-index="props.highlightedLogoColorIndex"
          @swatch-click="idx => emit('logo-color-click', idx)"
        />
        <!-- Applied: two actions; not applied: single Apply (parent handles shuffle via store) -->
        <div
          v-if="isThisLogoColorsApplied"
          class="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2"
        >
          <Button
            size="sm"
            variant="default"
            class="min-h-9 w-full justify-center text-center"
            @click.stop="emit('use-original-and-proceed')"
          >
            {{ logos_use_original({}, { locale: profileStore.currentLocale }) }}
          </Button>
          <Button
            size="sm"
            variant="outline"
            class="min-h-9 w-full justify-center text-center"
            @click.stop="emit('shuffle-colors', props.logo)"
          >
            {{ logos_shuffle_colors({}, { locale: profileStore.currentLocale }) }}
          </Button>
        </div>
        <div v-else class="flex w-full min-w-0 justify-end">
          <Button
            size="sm"
            variant="default"
            class="min-h-9 w-full max-w-full justify-center sm:w-auto"
            @click.stop="emit('apply-colors', props.logo)"
          >
            {{ logos_apply_colors({}, { locale: profileStore.currentLocale }) }}
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
