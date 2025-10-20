<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Trash } from 'lucide-vue-next'
  import { ColorsPreview } from '@/components/ui/colors-preview'
  import type { CustomLogo } from '@/services/logos/types'
  import { computed } from 'vue'
  import { Badge } from '@/components/ui/badge'

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')

  const props = defineProps<{
    logo: CustomLogo
  }>()

  const emit = defineEmits<{
    (e: 'click', logo: CustomLogo): void
    (e: 'delete', logo: CustomLogo): void
    (e: 'apply-colors', logo: CustomLogo): void
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
          alt="uploaded logo"
        />
      </div>
      <div
        v-if="props.logo.logo_colors && props.logo.logo_colors.length > 0"
        class="flex flex-row justify-between w-full"
      >
        <ColorsPreview
          :colors="props.logo.logo_colors.map(c => `rgb(${(c as number[]).join(',')})`) || []"
        />
        <Button
          v-if="props.logo.logo_colors && props.logo.logo_colors.length > 0"
          size="sm"
          variant="default"
          @click.stop="emit('apply-colors', props.logo)"
        >
          Apply colors
        </Button>
      </div>
      <div v-else class="flex flex-row justify-between w-full">
        <div class="text-sm text-muted-foreground">No colors detected</div>
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
