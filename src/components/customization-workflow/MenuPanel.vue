<script setup lang="ts">
  import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
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
    isExpanded?: boolean
    showBackButton?: boolean
    onBack?: () => void
    contentKey?: string | number
  }

  interface Emits {
    (e: 'update:isExpanded', value: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    expandable: false,
    isExpanded: false,
    showBackButton: false
  })

  const emit = defineEmits<Emits>()

  // Use computed to get the current expanded state from props
  const isExpanded = computed(() => props.isExpanded)

  const currentBreadcrumbIndex = ref(0)
  const cardContentRef = ref<HTMLElement | null>(null)

  const toggleExpanded = () => {
    if (props.expandable) {
      emit('update:isExpanded', !props.isExpanded)
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    if (
      index < currentBreadcrumbIndex.value &&
      props.breadcrumbs?.[index]?.action
    ) {
      props.breadcrumbs[index].action?.()
      emit('update:isExpanded', false)
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
      emit('update:isExpanded', false)
    }
  )

  // Scroll functionality
  function scrollToElement(
    elementId: string,
    behavior: 'smooth' | 'auto' = 'auto'
  ) {
    if (!cardContentRef.value) return

    nextTick(() => {
      if (!cardContentRef.value) return

      const container = cardContentRef.value
      const targetElement = container.querySelector(`#${elementId}`)

      if (targetElement) {
        const containerHeight = container.clientHeight
        const elementHeight = (targetElement as HTMLElement).offsetHeight

        if (behavior === 'auto') {
          // Auto behavior: instant scroll to center the element
          // Calculate element position relative to container content
          const elementRect = targetElement.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()

          // Get the element's position relative to the container's scrollable content
          const elementTop =
            elementRect.top - containerRect.top + container.scrollTop
          const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2

          // Scroll instantly within our container only
          container.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'auto'
          })
        } else {
          // Smooth behavior: two-phase scrolling for better UX
          // First, scroll to bring the element into view without affecting parents
          const elementRect = targetElement.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()

          // Calculate if element is visible in container
          const isElementVisible =
            elementRect.top >= containerRect.top &&
            elementRect.bottom <= containerRect.bottom

          if (!isElementVisible) {
            // Element is not visible, scroll to bring it into view
            const elementTop =
              elementRect.top - containerRect.top + container.scrollTop
            const scrollTop =
              elementTop - containerHeight / 2 + elementHeight / 2

            container.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: 'smooth'
            })
          } else {
            // Element is visible, just center it
            const elementCenter = elementRect.top + elementHeight / 2
            const containerCenter = containerRect.top + containerHeight / 2
            const scrollAdjustment = elementCenter - containerCenter

            container.scrollBy({
              top: scrollAdjustment,
              behavior: 'smooth'
            })
          }
        }
      }
    })
  }

  function handleScroll(event: Event) {
    // Prevent scroll from bubbling up beyond the CardContent
    if (cardContentRef.value && event.target === cardContentRef.value) {
      event.stopPropagation()
    }
  }

  onMounted(() => {
    // Add scroll event listener to the CardContent container
    // Use nextTick to ensure the template ref is available
    nextTick(() => {
      if (cardContentRef.value) {
        cardContentRef.value.addEventListener('scroll', handleScroll, {
          passive: true
        })
      }
    })
  })

  // Listen for scroll events from child components
  function handleScrollEvent(elementId: string) {
    scrollToElement(elementId)
  }

  onUnmounted(() => {
    // Clean up event listener
    if (cardContentRef.value) {
      cardContentRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  // Expose scroll function to parent components
  defineExpose({
    scrollToElement: (
      elementId: string,
      behavior: 'smooth' | 'auto' = 'auto'
    ) => scrollToElement(elementId, behavior)
  })
</script>

<template>
  <div
    :class="[
      'relative w-[28rem] max-h-[80vh]',
      isExpanded ? 'z-20 max-w-none' : ''
    ]"
  >
    <Card
      class="h-full max-h-[80vh] rounded-2xl justify-start transition-all duration-300 ease-in-out gap-0 overflow-hidden flex flex-col"
      :class="isExpanded ? 'w-[75vw]' : 'w-[470px]'"
    >
      <CardHeader
        class="pb-6 px-6 flex flex-row items-center justify-between gap-2 h-[4.5rem] flex-shrink-0"
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

      <CardContent class="p-0 pb-4 flex-1 overflow-y-auto min-h-0">
        <!-- Content slot for different panel types -->
        <Transition name="panel-slide" mode="out-in" appear>
          <div
            ref="cardContentRef"
            :key="props.contentKey"
            @scroll-to-element="handleScrollEvent"
            class="h-full overflow-y-auto max-h-[60vh]"
          >
            <slot
              :is-expanded="isExpanded"
              :current-breadcrumb="currentBreadcrumbIndex"
            />
          </div>
        </Transition>
      </CardContent>

      <!-- Footer actions -->
      <CardFooter class="px-6 flex-shrink-0 pt-6 border-t">
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
