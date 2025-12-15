<script setup lang="ts">
  import type { Collection, CollectionProduct } from '@/services/lockers/types'
  import { computed, ref } from 'vue'
  import CollectionProductListing from './CollectionProductListing.vue'
  type CollectionTab = 'products' | 'preview'
  const props = defineProps<{
    collection: Collection | null
    collectionTab: CollectionTab
    preSelectedProducts: CollectionProduct[]
    isCreatingCollection: boolean
  }>()
  const activeTab = computed(() => props.collectionTab)
  const collectionProductListingRef = ref<InstanceType<typeof CollectionProductListing> | null>(
    null
  )

  defineExpose({ collectionProductListingRef })
</script>

<template>
  <Transition name="slide-horizontal" mode="out-in">
    <div v-if="activeTab === 'products'" key="products" class="absolute inset-0">
      <CollectionProductListing
        v-if="isCreatingCollection"
        ref="collectionProductListingRef"
        :products="preSelectedProducts"
      />
      <CollectionProductListing
        v-else
        ref="collectionProductListingRef"
        :products="preSelectedProducts"
      />
      <!-- :collection-id="collection?.id"
        :is-creating-collection="isCreatingCollection" -->
    </div>

    <div v-else-if="activeTab === 'preview'" key="preview" class="absolute inset-0">
      <!-- <LockerAssetsListing :locker="locker" /> -->
    </div>
  </Transition>
</template>
