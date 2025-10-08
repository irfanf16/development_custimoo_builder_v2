<script setup lang="ts">
  import { computed, ref } from 'vue'
  // import { useEffectiveSelectors } from '@/stores/selectors/effective.store'
  // import { useCustomizationStore } from '@/stores/customization/customization.store'
  // import { useProductsStore } from '@/stores/products/products.store'
  import { Button } from '@/components/ui/button'
  import { Slider } from '@/components/ui/slider'
  import { ColorGrid } from '@/components/ui/color-grid'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import type { OutputColor } from '@/services/products/types'

  interface Props {
    layerId: string
    onBack: () => void
  }

  const props = defineProps<Props>()
  // const { effectiveSvgGroups } = useEffectiveSelectors()
  // const customizationStore = useCustomizationStore()
  // const productsStore = useProductsStore()

  // Mock pattern data - replace with actual data from store
  const patterns = ref([
    {
      id: 1,
      name: 'Cow Print',
      preview:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Ccircle cx='20' cy='20' r='8' fill='black'/%3E%3Ccircle cx='80' cy='30' r='6' fill='black'/%3E%3Ccircle cx='30' cy='70' r='10' fill='black'/%3E%3Ccircle cx='70' cy='80' r='7' fill='black'/%3E%3C/svg%3E\")"
    },
    {
      id: 2,
      name: 'Diagonal Weave',
      preview:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Cpath d='M0,0 L100,20 L100,40 L0,20 Z' fill='black'/%3E%3Cpath d='M0,40 L100,60 L100,80 L0,60 Z' fill='black'/%3E%3C/svg%3E\")"
    },
    {
      id: 3,
      name: 'Zebra Stripe',
      preview:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Cpath d='M0,0 L20,0 L20,100 L0,100 Z' fill='black'/%3E%3Cpath d='M40,0 L60,0 L60,100 L40,100 Z' fill='black'/%3E%3Cpath d='M80,0 L100,0 L100,100 L80,100 Z' fill='black'/%3E%3C/svg%3E\")"
    },
    {
      id: 4,
      name: 'Sea Creatures',
      preview:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Ccircle cx='30' cy='30' r='15' fill='black'/%3E%3Ccircle cx='70' cy='70' r='12' fill='black'/%3E%3C/svg%3E\")"
    },
    {
      id: 5,
      name: 'Zebra Stripe 2',
      preview:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Cpath d='M0,0 L20,0 L20,100 L0,100 Z' fill='black'/%3E%3Cpath d='M40,0 L60,0 L60,100 L40,100 Z' fill='black'/%3E%3Cpath d='M80,0 L100,0 L100,100 L80,100 Z' fill='black'/%3E%3C/svg%3E\")"
    },
    {
      id: 6,
      name: 'Diagonal Weave 2',
      preview:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Cpath d='M0,0 L100,20 L100,40 L0,20 Z' fill='black'/%3E%3Cpath d='M0,40 L100,60 L100,80 L0,60 Z' fill='black'/%3E%3C/svg%3E\")"
    },
    { id: 7, name: 'Pattern 7', preview: '#ff8800' },
    { id: 8, name: 'Pattern 8', preview: '#8800ff' },
    { id: 9, name: 'Pattern 9', preview: '#00ff88' },
    { id: 10, name: 'Pattern 10', preview: '#ff0088' },
    { id: 11, name: 'Pattern 11', preview: '#ff0088' },
    { id: 12, name: 'Pattern 12', preview: '#ff0088' },
    { id: 13, name: 'Pattern 13', preview: '#ff0088' },
    { id: 14, name: 'Pattern 14', preview: '#ff0088' },
    { id: 15, name: 'Pattern 15', preview: '#ff0088' },
    { id: 16, name: 'Pattern 16', preview: '#ff0088' },
    { id: 17, name: 'Pattern 17', preview: '#ff0088' },
    { id: 18, name: 'Pattern 18', preview: '#ff0088' },
    { id: 19, name: 'Pattern 19', preview: '#ff0088' },
    { id: 20, name: 'Pattern 20', preview: '#ff0088' },
    { id: 21, name: 'Pattern 21', preview: '#ff0088' },
    { id: 22, name: 'Pattern 22', preview: '#ff0088' },
    { id: 23, name: 'Pattern 23', preview: '#ff0088' }
  ])

  const selectedPattern = ref<number | null>(null)
  const showAllPatterns = ref(false)
  const scale = ref([50])
  const angle = ref([0])

  // Get the current layer
  // const currentLayer = computed(() => {
  //   return effectiveSvgGroups.value?.find(group => group.id === props.layerId)
  // })

  // Get patterns to display (first 7 or all)
  const displayedPatterns = computed(() => {
    return showAllPatterns.value ? patterns.value : patterns.value.slice(0, 7)
  })

  // Get remaining pattern count
  const remainingPatternsCount = computed(() => {
    return Math.max(0, patterns.value.length - 7)
  })

  // Mock color palette for the selected pattern
  const patternColors = computed<OutputColor[]>(() => {
    return [
      { name: 'Yellow', value: '#ffff00', position: 0 },
      { name: 'Orange', value: '#ff8800', position: 1 },
      { name: 'Red', value: '#ff0000', position: 2 },
      { name: 'Maroon', value: '#800000', position: 3 },
      { name: 'Teal', value: '#008080', position: 4 },
      { name: 'Blue', value: '#0000ff', position: 5 },
      { name: 'Dark Green', value: '#006400', position: 6 },
      { name: 'Light Blue', value: '#87ceeb', position: 7 },
      { name: 'Grey', value: '#808080', position: 8 },
      { name: 'Beige', value: '#f5f5dc', position: 9 },
      { name: 'Brown', value: '#8b4513', position: 10 },
      { name: 'Black', value: '#000000', position: 11 },
      { name: 'White', value: '#ffffff', position: 12 },
      { name: 'Purple', value: '#800080', position: 13 },
      { name: 'Pink', value: '#ffc0cb', position: 14 },
      { name: 'Lime', value: '#00ff00', position: 15 },
      { name: 'Cyan', value: '#00ffff', position: 16 },
      { name: 'Magenta', value: '#ff00ff', position: 17 },
      { name: 'Navy', value: '#000080', position: 18 },
      { name: 'Olive', value: '#808000', position: 19 },
      { name: 'Coral', value: '#ff7f50', position: 20 },
      { name: 'Gold', value: '#ffd700', position: 21 },
      { name: 'Silver', value: '#c0c0c0', position: 22 },
      { name: 'Indigo', value: '#4b0082', position: 23 },
      { name: 'Violet', value: '#8a2be2', position: 24 },
      { name: 'Crimson', value: '#dc143c', position: 25 },
      { name: 'Forest Green', value: '#228b22', position: 26 },
      { name: 'Sky Blue', value: '#87ceeb', position: 27 },
      { name: 'Salmon', value: '#fa8072', position: 28 },
      { name: 'Turquoise', value: '#40e0d0', position: 29 },
      { name: 'Khaki', value: '#f0e68c', position: 30 },
      { name: 'Plum', value: '#dda0dd', position: 31 },
      { name: 'Tomato', value: '#ff6347', position: 32 },
      { name: 'Lavender', value: '#e6e6fa', position: 33 },
      { name: 'Mint', value: '#f5fffa', position: 34 },
      { name: 'Peach', value: '#ffdab9', position: 35 },
      { name: 'Cream', value: '#fff8dc', position: 36 },
      { name: 'Ivory', value: '#fffff0', position: 37 },
      { name: 'Snow', value: '#fffafa', position: 38 }
    ]
  })

  // Color mode tabs
  const colorMode = ref<'soccer' | 'socks' | 'pantone'>('soccer')
  const selectedColor = ref<string | null>(null)

  function selectPattern(patternId: number) {
    selectedPattern.value = patternId
  }

  function toggleShowAllPatterns() {
    showAllPatterns.value = !showAllPatterns.value
  }

  function selectPatternColor(color: OutputColor) {
    selectedColor.value = color.value
    // TODO: Update pattern color in store
    console.log('Selected pattern color:', color)
  }

  // Breadcrumb logic for pattern editing
  const breadcrumbs = computed(() => [
    {
      label: 'Pattern',
      action: props.onBack
    },
    {
      label: props.layerId,
      action: undefined // No link for current layer
    }
  ])

  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Pattern Swatches Section -->
    <div class="space-y-4 px-4 md:px-6">
      <h3 class="text-lg font-semibold">Select Pattern</h3>

      <!-- Pattern Grid -->
      <div class="grid grid-cols-4 gap-3 transition-all">
        <button
          v-for="pattern in displayedPatterns"
          :key="pattern.id"
          :class="[
            'h-16 rounded-lg border-2 transition-all hover:scale-105 relative',
            selectedPattern === pattern.id
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:border-primary/50'
          ]"
          :style="{
            backgroundColor: pattern.preview.startsWith('url') ? 'white' : pattern.preview,
            backgroundImage: pattern.preview.startsWith('url') ? pattern.preview : 'none'
          }"
          @click="selectPattern(pattern.id)"
        >
          <!-- Selection indicator -->
          <div
            v-if="selectedPattern === pattern.id"
            class="absolute bottom-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
          >
            <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </button>

        <button
          v-if="remainingPatternsCount > 0 && !showAllPatterns"
          class="relative h-16 rounded-lg border-2 border-border bg-muted/40 text-sm font-semibold text-muted-foreground transition-all hover:scale-105 flex items-center justify-center"
          @click="toggleShowAllPatterns"
        >
          +{{ remainingPatternsCount }}
        </button>
      </div>

      <!-- Show Less Button -->
      <div v-if="showAllPatterns && remainingPatternsCount > 0" class="flex justify-end">
        <Button variant="outline" size="sm" class="rounded-lg" @click="toggleShowAllPatterns">
          Show less
        </Button>
      </div>
    </div>

    <!-- Scale and Angle Sliders -->
    <div class="space-y-6 p-4 md:p-6">
      <!-- Scale Slider -->
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <label class="text-sm font-medium">Scale</label>
          <span class="text-sm text-muted-foreground">{{ scale[0] }}%</span>
        </div>
        <Slider v-model="scale" :max="100" :min="10" :step="5" class="w-full" />
      </div>

      <!-- Angle Slider -->
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <label class="text-sm font-medium">Angle</label>
          <span class="text-sm text-muted-foreground">{{ angle[0] }}°</span>
        </div>
        <Slider v-model="angle" :max="360" :min="0" :step="15" class="w-full" />
      </div>
    </div>

    <!-- Color Selection Accordion -->
    <Accordion type="single" collapsible default-value="colors">
      <AccordionItem value="colors" class="px-4 md:px-6 border-t border-border">
        <AccordionTrigger>
          <span class="text-base font-medium">Colour Nacho Kings Nacho Kings</span>
        </AccordionTrigger>
        <AccordionContent class="px-4 pb-4">
          <div class="space-y-4">
            <!-- Color Mode Tabs -->
            <div class="flex gap-1 bg-muted p-1 rounded-lg">
              <button
                :class="[
                  'px-3 py-2 text-sm rounded-md transition-colors',
                  colorMode === 'soccer'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
                @click="colorMode = 'soccer'"
              >
                Soccer colors s...
              </button>
              <button
                :class="[
                  'px-3 py-2 text-sm rounded-md transition-colors',
                  colorMode === 'socks'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
                @click="colorMode = 'socks'"
              >
                Socks colours
              </button>
              <button
                :class="[
                  'px-3 py-2 text-sm rounded-md transition-colors',
                  colorMode === 'pantone'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
                @click="colorMode = 'pantone'"
              >
                Pantone
              </button>
            </div>

            <!-- Color Grid -->
            <ColorGrid
              :colors="patternColors"
              :selected-color="selectedColor || undefined"
              :grid-cols="8"
              button-size="md"
              @color-select="selectPatternColor"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<style scoped>
  /* Pattern edit specific styles */
</style>
