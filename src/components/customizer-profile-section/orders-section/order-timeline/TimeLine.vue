<template>
  <div class="relative w-full" :class="{ 'flex flex-col': direction === 'vertical' }" data-testid="profile-timeline-list">
    <div class="relative">
      <div
        v-if="isOrderStatus"
        class="pointer-events-none absolute left-4 sm:left-5 md:left-6 top-0 bottom-0 flex flex-col"
        aria-hidden="true"
      >
        <div class="w-full bg-primary transition-all duration-500 ease-in-out"></div>
        <div class="w-full flex-grow border-l-2 border-dashed bg-primary border-primary"></div>
      </div>

      <div class="relative p-3 sm:p-4 md:p-5">
        <template v-if="isOrderStatus">
          <div
            v-for="(step, index) in orderStatusSteps"
            :key="index"
            class="flex mb-6 sm:mb-8 relative"
            :class="[
              alternating ? (index % 2 === 0 ? 'justify-start' : 'justify-end') : 'justify-start'
            ]"
          >
            <!-- Step Circle -->
            <div
              class="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300 absolute"
              :class="[
                index < 3
                  ? 'bg-primary text-primary-foreground'
                  : 'border-2 border-primary text-primary-foreground bg-primary',
                alternating ? 'left-1/2 transform -translate-x-1/2' : 'left-0'
              ]"
            >
              <svg
                v-if="index < 3"
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span v-else class="text-xs sm:text-sm">{{ index + 1 }}</span>
            </div>

            <!-- Content Container -->
            <div
              class="bg-primary p-3 sm:p-4 md:p-6 rounded-lg shadow-sm border text-sm sm:text-base"
              :class="[
                alternating
                  ? index % 2 === 0
                    ? 'ml-12 sm:ml-16 md:ml-20 mr-auto'
                    : 'mr-12 sm:mr-16 md:mr-20 ml-auto'
                  : 'ml-12 sm:ml-16 md:ml-20',
                index < 3 ? 'border-primary' : 'border-border'
              ]"
            >
              <!-- Step Label -->
              <div
                class="font-medium"
                :class="[index < 3 ? 'text-foreground' : 'text-muted-foreground']"
              >
                {{ step }}
              </div>
            </div>
          </div>
        </template>
        <!-- Dynamic Timeline -->
        <template v-else>
          <slot></slot>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    orderStatus: string | undefined
    isOrderStatus: boolean
    currentStep: number
    totalItems: number
    direction: string
    alternating: boolean
  }>()
  const orderStatusSteps = [
    'Order Created',
    'Artwork Approval',
    'Sample Design',
    'In Production',
    'Order Shipped',
    'Order Completed'
  ]
</script>
