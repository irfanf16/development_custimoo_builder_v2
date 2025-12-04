<script setup lang="ts">
  import { ref, watch } from 'vue'
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
  } from '@/components/ui/breadcrumb'

  interface BreadcrumbItem {
    label: string
    action?: () => void
    isActive?: boolean
  }

  interface Props {
    breadcrumbs: BreadcrumbItem[]
  }

  const props = defineProps<Props>()

  const currentBreadcrumbIndex = ref(0)

  const handleBreadcrumbClick = (index: number) => {
    if (index < currentBreadcrumbIndex.value && props.breadcrumbs?.[index]?.action) {
      props.breadcrumbs[index].action?.()
    }
  }

  // Watch for breadcrumb changes to update active state
  watch(
    () => props.breadcrumbs,
    newBreadcrumbs => {
      if (newBreadcrumbs) {
        currentBreadcrumbIndex.value = newBreadcrumbs.length - 1
      }
    },
    { immediate: true }
  )
</script>

<template>
  <Breadcrumb v-if="breadcrumbs && breadcrumbs.length > 0" class="min-w-0 overflow-hidden">
    <BreadcrumbList class="flex-wrap-nowrap!">
      <template v-for="(item, index) in breadcrumbs" :key="index">
        <Transition name="breadcrumb-item" appear>
          <BreadcrumbItem
            :class="{
              'cursor-pointer': index < currentBreadcrumbIndex
            }"
            @click="handleBreadcrumbClick(index)"
          >
            <BreadcrumbLink
              v-if="index < currentBreadcrumbIndex"
              class="hover:text-primary transition-colors truncate max-w-[280px] font-brand"
            >
              {{ item.label }}
            </BreadcrumbLink>
            <BreadcrumbPage v-else class="truncate max-w-[280px] font-brand">
              {{ item.label }}
            </BreadcrumbPage>

            <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" />
          </BreadcrumbItem>
        </Transition>
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<style scoped>
  /* Smooth transitions for breadcrumb items */
  .breadcrumb-item-enter-active,
  .breadcrumb-item-leave-active {
    transition: all 200ms ease;
  }

  .breadcrumb-item-enter-from {
    opacity: 0;
    transform: translateY(-4px);
  }

  .breadcrumb-item-leave-to {
    opacity: 0;
    transform: translateY(4px);
  }
</style>
