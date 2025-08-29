<script setup lang="ts">
  import { ref, watch } from 'vue'
  import {
    Card,
    CardHeader,
    CardContent,
    CardFooter
  } from '@/components/ui/card'
  import { Button } from '@/components/ui/button'
  import { Maximize2, Minimize2 } from 'lucide-vue-next'
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
    breadcrumbs?: BreadcrumbItem[]
    expandable?: boolean
    defaultExpanded?: boolean
    showBackButton?: boolean
    onBack?: () => void
    contentKey?: string | number
  }

  const props = withDefaults(defineProps<Props>(), {
    expandable: false,
    defaultExpanded: false,
    showBackButton: false
  })

  const isExpanded = ref(props.defaultExpanded)
  const currentBreadcrumbIndex = ref(0)

  const toggleExpanded = () => {
    if (props.expandable) {
      isExpanded.value = !isExpanded.value
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    if (
      index < currentBreadcrumbIndex.value &&
      props.breadcrumbs?.[index]?.action
    ) {
      props.breadcrumbs[index].action?.()
      isExpanded.value = false
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

  // Collapse panel when switching to a different content key (panel)
  watch(
    () => props.contentKey,
    () => {
      isExpanded.value = false
    }
  )
</script>

<template>
  <div
    :class="[
      'relative w-[28rem] h-[80vh]',
      isExpanded ? 'z-20 max-w-none' : ''
    ]"
  >
    <Card
      class="w-full p-0 h-[auto] rounded-2xl justify-start transition-all duration-300 ease-in-out gap-0 overflow-hidden"
      :class="isExpanded ? 'w-[80vw]' : 'w-full'"
    >
      <CardHeader
        class="py-6 px-6 flex flex-row items-center justify-between gap-2 h-[4.5rem]"
      >
        <div
          class="flex items-center gap-3 flex-1 min-w-0 whitespace-nowrap overflow-hidden"
        >
          <!-- Breadcrumb Navigation -->
          <Breadcrumb
            v-if="breadcrumbs && breadcrumbs.length > 0"
            class="min-w-0 overflow-hidden"
          >
            <BreadcrumbList>
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
                      class="hover:text-primary transition-colors truncate max-w-[280px]"
                    >
                      {{ item.label }}
                    </BreadcrumbLink>
                    <BreadcrumbPage v-else class="truncate max-w-[280px]">
                      {{ item.label }}
                    </BreadcrumbPage>

                    <BreadcrumbSeparator
                      v-if="index < breadcrumbs.length - 1"
                    />
                  </BreadcrumbItem>
                </Transition>
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Button
          v-if="expandable"
          variant="outline"
          size="icon"
          class="rounded-lg"
          @click="toggleExpanded"
        >
          <component :is="isExpanded ? Minimize2 : Maximize2" class="size-4" />
        </Button>
      </CardHeader>

      <CardContent class="p-0 pb-4 px-6">
        <!-- Content slot for different panel types -->
        <Transition name="panel-slide" mode="out-in" appear>
          <div :key="props.contentKey">
            <slot
              :is-expanded="isExpanded"
              :current-breadcrumb="currentBreadcrumbIndex"
            />
          </div>
        </Transition>
      </CardContent>

      <!-- Footer actions -->
      <CardFooter class="px-6 py-4 pt-0">
        <slot name="footer" :is-expanded="isExpanded" />
      </CardFooter>
    </Card>
  </div>
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

  /* Content slide/fade transitions */
  .panel-slide-enter-active,
  .panel-slide-leave-active {
    transition:
      opacity 200ms ease,
      transform 200ms ease;
  }

  .panel-slide-enter-from {
    opacity: 0;
    transform: translateX(12px);
  }

  .panel-slide-leave-to {
    opacity: 0;
    transform: translateX(-12px);
  }
</style>
