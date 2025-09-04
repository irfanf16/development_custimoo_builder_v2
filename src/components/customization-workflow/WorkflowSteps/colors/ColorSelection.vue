<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import { Button } from '@/components/ui/button'

  // Store (kept in case we want to wire real data later)
  const productsStore = useProductsStore()
  const product = computed(() => productsStore.activeProductDetails as any)

  // Dummy palettes – replace with real data later
  type Palette = { name: string; colors: string[] }
  const palettes: Palette[] = [
    {
      name: 'NHL',
      colors: [
        '#F9C80E',
        '#F86624',
        '#EA3546',
        '#662E9B',
        '#43BCCD',
        '#0EA5E9',
        '#2563EB',
        '#0F172A',
        '#0EA5A0',
        '#0891B2',
        '#F43F5E',
        '#FB923C',
        '#94A3B8',
        '#64748B',
        '#111827',
        '#F59E0B',
        '#EF4444',
        '#22C55E',
        '#10B981',
        '#14B8A6',
        '#06B6D4',
        '#3B82F6',
        '#6366F1',
        '#A78BFA'
      ]
    },
    {
      name: 'Pantone',
      colors: [
        '#FFB703',
        '#FB8500',
        '#FF006E',
        '#8338EC',
        '#3A86FF',
        '#2DD4BF',
        '#22D3EE',
        '#0EA5E9',
        '#64748B',
        '#94A3B8',
        '#1F2937',
        '#111827'
      ]
    }
  ]

  // Three color slots shown in the UI
  const slotLabels = ['Color 1', 'Color 2', 'Color 3']
  const slotValues = ref<string[]>(['#F9C80E', '#E5E7EB', '#111827'])

  // Local clipboard for copy/paste between slots
  const clipboardHex = ref<string | null>(null)

  // Per-slot mode: 'colors' | 'pantone'
  const slotMode = ref<Record<number, 'colors' | 'pantone'>>({
    0: 'colors',
    1: 'colors',
    2: 'colors'
  })

  const currentPaletteName = ref<string>('NHL')
  const currentPalette = computed<Palette>(() => {
    return (
      palettes.find(p => p.name === currentPaletteName.value) || palettes[0]
    )
  })

  function setSlotColor(slotIndex: number, hex: string) {
    const next = [...slotValues.value]
    next[slotIndex] = hex
    slotValues.value = next
  }

  function copyFrom(slotIndex: number) {
    clipboardHex.value = slotValues.value[slotIndex]
  }

  function pasteTo(slotIndex: number) {
    if (!clipboardHex.value) return
    setSlotColor(slotIndex, clipboardHex.value)
  }

  function shuffleAll() {
    const colors = currentPalette.value.colors
    if (!colors.length) return
    slotValues.value = slotValues.value.map(
      () => colors[Math.floor(Math.random() * colors.length)]
    )
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Lucky / Locker actions -->
    <div class="rounded-xl border border-border bg-muted/40 p-4 mx-6">
      <div class="flex items-start gap-4">
        <i-flex-line-paint-palette class="size-10 text-primary" />
        <div class="flex-1">
          <div class="text-base font-semibold text-foreground">
            Feeling lucky?
          </div>
          <div class="text-sm text-muted-foreground">
            Let’s see what the color gods decide.
          </div>
        </div>
      </div>
      <div class="mt-4">
        <Button class="w-full" variant="default" @click="shuffleAll"
          >Shuffle</Button
        >
      </div>
      <div
        class="relative my-4 flex items-center justify-center text-xs text-muted-foreground"
      >
        <span class="px-3 bg-card">or</span>
        <div class="absolute inset-x-0 h-px bg-border"></div>
      </div>
      <div>
        <Button class="w-full" variant="outline">Choose from locker</Button>
      </div>
    </div>

    <!-- Color slots -->
    <Accordion type="single" collapsible>
      <AccordionItem
        v-for="(label, idx) in slotLabels"
        :key="label"
        :value="String(idx)"
        class="px-6"
      >
        <AccordionTrigger>
          <div class="flex justify-between gap-3 w-full group">
            <div class="flex items-center gap-3 w-full">
              <span
                class="inline-block size-7 rounded-full border border-border"
                :style="{ background: slotValues[idx] }"
              />
              <span class="text-base">{{ label }}</span>
            </div>
            <div
              class="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-hover:no-underline transition-opacity"
            >
              <Button size="sm" variant="outline" @click.stop="copyFrom(idx)"
                ><span class="no-underline">Copy</span></Button
              >
              <Button
                size="sm"
                variant="outline"
                :disabled="!clipboardHex"
                @click.stop="pasteTo(idx)"
                ><span class="no-underline">Paste</span>
              </Button>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <!-- Controls row -->
          <div class="flex items-center justify-between gap-3">
            <div
              class="inline-flex rounded-lg border border-border bg-muted p-1 text-sm"
            >
              <button
                class="px-3 h-9 rounded-md transition-colors"
                :class="[
                  slotMode[idx] === 'colors'
                    ? 'bg-card text-foreground shadow'
                    : 'text-muted-foreground'
                ]"
                @click="slotMode[idx] = 'colors'"
              >
                Colors
              </button>
              <button
                class="px-3 h-9 rounded-md transition-colors"
                :class="[
                  slotMode[idx] === 'pantone'
                    ? 'bg-card text-foreground shadow'
                    : 'text-muted-foreground'
                ]"
                @click="slotMode[idx] = 'pantone'"
              >
                Pantone
              </button>
            </div>
          </div>

          <!-- Palette select -->
          <div class="mt-3">
            <select
              v-model="currentPaletteName"
              class="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option v-for="p in palettes" :key="p.name" :value="p.name">
                {{ p.name }}
              </option>
            </select>
          </div>

          <!-- Swatches grid -->
          <div class="mt-4 grid grid-cols-8 gap-3">
            <button
              v-for="hex in currentPalette.colors"
              :key="hex + idx"
              class="relative h-8 w-8 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              :style="{ background: hex }"
              @click="setSlotColor(idx, hex)"
            >
              <span
                v-if="slotValues[idx] === hex"
                class="absolute inset-0 rounded-full ring-2 ring-primary"
              />
            </button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<style scoped></style>
