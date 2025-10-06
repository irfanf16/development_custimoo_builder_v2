<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store.ts'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { Button } from '@/components/ui/button'
  import type { OutputProductName } from '@/services/products/types'

  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const history = useHistoryStore()
  const texts = computed(() => {
    const map =
      (
        productsStore.activeProductDetails as {
          productnames?: OutputProductName[]
        }
      )?.productnames || []
    return map
  })

  const editedValues = ref<Record<number, string>>({})

  function onChangeValue(idx: number, value: string) {
    editedValues.value[idx] = value
  }

  function saveValue(idx: number) {
    const key = String(customizationStore.customization?.product_id || '')
    const current =
      (
        customizationStore.customization?.product_custom_texts as Record<
          string,
          Array<{ value: string }>
        >
      )?.[key]?.[idx]?.value || ''
    const next = editedValues.value[idx] ?? current
    if (next === current) return
    history.execute('text.set-value', {
      key,
      index: idx,
      prevValue: current,
      nextValue: next
    })
  }

  // Breadcrumbs only
  const breadcrumbs = computed(() => [{ label: 'Texts' }])
  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <div class="p-4 md:p-6 flex flex-col gap-4">
    <div
      v-for="t in texts"
      :key="t.id"
      class="flex items-center justify-between border rounded-lg p-3"
    >
      <div>
        <div class="font-medium">
          {{ (t as OutputProductName).name_of_placement || 'Text' }}
        </div>
        <div class="text-xs text-muted-foreground">Placement</div>
      </div>
      <div class="flex gap-2 items-center">
        <input
          class="h-9 rounded-md border border-border bg-card px-3 text-sm w-48"
          type="text"
          :value="editedValues[(t as OutputProductName).id] ?? ''"
          @input="
            onChangeValue(
              (t as OutputProductName).id,
              ($event.target as HTMLInputElement).value
            )
          "
        />
        <Button
          variant="default"
          size="sm"
          @click="saveValue((t as OutputProductName).id)"
          >Save</Button
        >
      </div>
    </div>
    <Button variant="outline" class="rounded-lg">Add additional text</Button>
  </div>
</template>

<style scoped></style>
