<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useCustomizationStore } from '@/stores/customization/customization.store.ts'
  import { useHistoryStore } from '@/stores/history/history.store'
  import { Button } from '@/components/ui/button'

  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const history = useHistoryStore()
  const texts = computed(() => {
    const map = (productsStore.activeProductDetails as any)?.productnames || []
    return map
  })

  const editedValues = ref<Record<number, string>>({})

  function onChangeValue(idx: number, value: string) {
    editedValues.value[idx] = value
  }

  function saveValue(idx: number) {
    const key = String(customizationStore.customization?.product_id || '')
    const current =
      (customizationStore.customization?.product_custom_texts as any)?.[key]?.[
        idx
      ]?.value || ''
    const next = editedValues.value[idx] ?? current
    if (next === current) return
    history.execute('text.set-value', {
      key,
      index: idx,
      prevValue: current,
      nextValue: next
    })
  }
</script>

<template>
  <div class="p-6 flex flex-col gap-4">
    <div
      v-for="t in texts"
      :key="t.id"
      class="flex items-center justify-between border rounded-lg p-3"
    >
      <div>
        <div class="font-medium">{{ t.name_of_placement || 'Text' }}</div>
        <div class="text-xs text-muted-foreground">Placement</div>
      </div>
      <div class="flex gap-2 items-center">
        <input
          class="h-9 rounded-md border border-border bg-card px-3 text-sm w-48"
          type="text"
          :value="editedValues[t.id] ?? t.value ?? ''"
          @input="
            onChangeValue(t.id, ($event.target as HTMLInputElement).value)
          "
        />
        <Button variant="default" size="sm" @click="saveValue(t.id)"
          >Save</Button
        >
      </div>
    </div>
    <Button variant="outline" class="rounded-lg">Add additional text</Button>
  </div>
</template>

<style scoped></style>
