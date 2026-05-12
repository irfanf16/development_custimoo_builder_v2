<script setup lang="ts">
  import { ref } from 'vue'
  import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  import { ChevronRight } from 'lucide-vue-next'

  interface Props {
    onSelectLayer?: (layerId: string) => void
  }

  const props = defineProps<Props>()
  const { effectiveSvgGroups } = useEffectiveSelectors()

  // Track which layers have patterns selected
  const layersWithPatterns = ref<Set<string>>(new Set())

  function handleSelectLayer(layerId: string) {
    props.onSelectLayer?.(layerId)
  }

  // function resetAllPatterns() {
  //   layersWithPatterns.value.clear()
  //   // TODO: Clear pattern selections from store
  // }

  // // Check if any patterns are selected
  // const hasPatternsSelected = computed(() => layersWithPatterns.value.size > 0)

  // // Breadcrumb logic for pattern layer selection
  // const breadcrumbs = computed(() => [{ label: 'Pattern' }])

  // // Header configuration with reset button
  // const headerExtras = computed(() => ({
  //   breadcrumbs,
  //   actionButton: hasPatternsSelected.value
  //     ? {
  //         label: 'Reset',
  //         tooltip: 'Clear all pattern selections',
  //         callback: resetAllPatterns
  //       }
  //     : undefined
  // }))
</script>

<template>
  <div data-testid="workflow-patterns-layer-selection" class="flex flex-col gap-6">
    <!-- Header Section -->
    <div class="px-4 md:px-6">
      <p class="text-base text-muted-foreground">Apply and customise patterns.</p>
    </div>

    <!-- Layer List -->
    <div class="flex flex-col">
      <button
        v-for="svgGroup in effectiveSvgGroups"
        :key="svgGroup.id"
        :data-testid="`workflow-patterns-layer-item-${svgGroup.id}`"
        class="h-14 px-4 md:px-6 rounded-md justify-between flex items-center hover:bg-muted/50 transition-colors"
        @click="() => handleSelectLayer(svgGroup.id)"
      >
        <div class="flex items-center gap-3">
          <!-- Pattern preview swatch -->
          <div
            class="size-7 rounded-lg border border-border bg-white flex items-center justify-center"
          >
            <!-- Pattern preview will be shown here once selected -->
            <span v-if="!layersWithPatterns.has(svgGroup.id)" class="text-xs text-muted-foreground"
              >?</span
            >
            <!-- TODO: Show actual pattern preview when selected -->
          </div>
          <span class="text-base font-semibold text-card-foreground">{{ svgGroup.id }}</span>
        </div>
        <ChevronRight class="size-4 text-muted-foreground" />
      </button>
    </div>
  </div>
</template>

<style scoped>
  /* Pattern layer selection specific styles */
</style>
