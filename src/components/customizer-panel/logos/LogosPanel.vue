<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useProductsStore } from '@/stores/products'
  import { Button } from '@/components/ui/button'
  import LogoPlacementThumb from './LogoPlacementThumb.vue'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'

  const productsStore = useProductsStore()

  type SubPanel = 'list' | 'placement' | 'controls' | 'editor'
  const subPanel = ref<SubPanel>('list')

  // recent logos are displayed regardless; keep computed if needed later

  function goToPlacement() {
    subPanel.value = 'placement'
    productsStore.setLogosSubStep('placement')
  }
  function goToControls() {
    subPanel.value = 'controls'
    productsStore.setLogosSubStep('controls')
  }
  function goToEditor() {
    subPanel.value = 'editor'
    productsStore.setLogosSubStep('editor')
  }
  function goToList() {
    subPanel.value = 'list'
    productsStore.setLogosSubStep('list')
  }

  const product = computed(() => (productsStore.product as any) || null)
  const styleBase = computed(() => (productsStore.style as any) || null)
  const designBase = computed(() => (productsStore.design as any) || null)
  const placements = computed(
    () => (product.value?.logos_setting as any[]) || []
  )

  function handleSelectRecentLogo(logo: any) {
    productsStore.addCustomLogoFromRecent(logo)
    goToControls()
  }
</script>

<template>
  <div class="p-4">
    <div v-if="subPanel === 'list'" class="flex flex-col gap-4">
      <!-- Empty state uploader -->
      <div
        v-if="
          (productsStore.customizedProduct?.custom_logos?.length || 0) === 0
        "
        class="rounded-xl border border-dashed border-border p-6 flex flex-col items-center justify-center gap-2 text-center"
      >
        <div
          class="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" class="w-6 h-6 text-muted-foreground">
            <path
              fill="currentColor"
              d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14Zm-2-2H5V5h14ZM8 13l2.03-2.71a1 1 0 0 1 1.58-.06L13 12l2-3l3 4Z"
            />
          </svg>
        </div>
        <div class="text-sm font-medium">
          Drag and drop or
          <button class="text-primary underline underline-offset-2">
            click to upload
          </button>
        </div>
        <div class="text-xs text-muted-foreground">
          Supported formats: JPG, PNG, PDF. Max size: 10MB.
        </div>
      </div>

      <!-- When a logo exists -->
      <div
        v-else
        class="rounded-xl border border-border p-3 flex flex-col items-center gap-3"
      >
        <div
          class="w-full h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden"
        >
          <img
            :src="
              productsStore.customizedProduct?.custom_logos?.[
                productsStore.selectedCustomLogoIdx ?? 0
              ]?.url || productsStore.customizedProduct?.custom_logos?.[0]?.url
            "
            class="max-h-full object-contain"
            alt="active logo"
          />
        </div>
        <Button variant="outline" class="rounded-lg w-full">Add logo</Button>
      </div>

      <!-- Recent logos -->
      <div class="flex flex-col gap-2">
        <div class="text-lg font-semibold">Recent logos</div>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="logo in productsStore.recentLogos || []"
            :key="logo.id"
            class="aspect-square rounded-lg border border-border overflow-hidden"
            @click="handleSelectRecentLogo(logo)"
          >
            <img
              :src="logo.url"
              class="w-full h-full object-cover"
              alt="recent logo"
            />
          </button>
        </div>
      </div>

      <div class="flex gap-3">
        <Button variant="outline" class="rounded-lg" @click="goToPlacement"
          >Choose placement</Button
        >
      </div>
    </div>

    <div v-else-if="subPanel === 'placement'" class="flex flex-col gap-4">
      <div class="text-sm">Placement presets</div>
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="s in placements"
          :key="s.id"
          class="flex flex-col gap-2 items-center"
        >
          <LogoPlacementThumb
            v-if="product && styleBase && designBase"
            :product="product"
            :style-base="styleBase"
            :design-base="designBase"
            :setting="s"
            :width="112"
            :height="112"
          />
          <div class="text-xs text-muted-foreground truncate max-w-[112px]">
            {{ s.name_of_placement }}
          </div>
        </div>
      </div>
      <div class="flex gap-3">
        <Button variant="outline" class="rounded-lg" @click="goToList"
          >Back to logos</Button
        >
        <Button variant="default" class="rounded-lg" @click="goToList"
          >Save placement</Button
        >
      </div>
    </div>

    <div v-else-if="subPanel === 'controls'" class="flex flex-col gap-4">
      <div class="text-sm">Controls</div>
      <div class="flex gap-3">
        <Button variant="outline" class="rounded-lg" @click="goToList"
          >Back</Button
        >
        <Button variant="default" class="rounded-lg" @click="goToEditor"
          >Editor</Button
        >
      </div>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="text-sm">Editor</div>
      <Accordion type="single" collapsible>
        <AccordionItem value="recolor">
          <template #trigger>Recolour logo</template>
          <div class="flex flex-col gap-2">
            <div class="text-xs">Primary</div>
            <div class="h-8 bg-muted rounded" />
            <div class="text-xs">More options</div>
            <div class="grid grid-cols-8 gap-1">
              <div v-for="i in 16" :key="i" class="h-6 bg-muted rounded" />
            </div>
          </div>
        </AccordionItem>
      </Accordion>
      <div class="flex gap-3">
        <Button variant="outline" class="rounded-lg" @click="goToControls"
          >Back to controls</Button
        >
      </div>
    </div>
  </div>
</template>
