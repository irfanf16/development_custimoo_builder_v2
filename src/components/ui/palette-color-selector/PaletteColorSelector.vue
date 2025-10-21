<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { ColorGrid } from '@/components/ui/color-grid'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'

  type OutputColor = {
    position: number
    name: string
    value: string
  }

  type Palette = {
    id: number
    name: string
    colors: OutputColor[]
  }

  interface Props {
    class?: HTMLAttributes['class']
    palettes: Palette[]
    selectedColor?: string
  }

  interface Emits {
    (e: 'color-select', color: OutputColor): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Initialize with the first palette's ID
  const currentPaletteId = ref<string>(
    props.palettes.length > 0 ? String(props.palettes[0]?.id || '') : ''
  )

  // Update currentPaletteId if palettes change
  watch(
    () => props.palettes,
    newPalettes => {
      if (
        newPalettes.length > 0 &&
        !newPalettes.find(p => String(p?.id || '') === currentPaletteId.value)
      ) {
        currentPaletteId.value = String(newPalettes[0]?.id || '')
      }
    },
    { immediate: true }
  )

  // Get the currently active palette for lazy rendering
  const activePalette = computed(() => {
    return props.palettes.find(p => String(p.id) === currentPaletteId.value) || props.palettes[0]
  })

  function handleColorSelect(color: OutputColor) {
    emit('color-select', color)
  }
</script>

<template>
  <div v-if="palettes.length > 0" :class="cn('space-y-3', props.class)" class="space-y-3">
    <!-- Tabs for palettes -->
    <Tabs v-model="currentPaletteId">
      <TabsList
        class="w-full grid"
        :style="{ gridTemplateColumns: `repeat(${palettes.length}, 1fr)` }"
      >
        <TabsTrigger v-for="palette in palettes" :key="palette.id" :value="String(palette.id)">
          {{ palette.name }}
        </TabsTrigger>
      </TabsList>

      <!-- Only render the active tab content for better performance -->
      <TabsContent v-if="activePalette" :value="String(activePalette.id)">
        <ColorGrid
          :colors="activePalette.colors"
          :selected-color="selectedColor"
          @color-select="handleColorSelect"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>
