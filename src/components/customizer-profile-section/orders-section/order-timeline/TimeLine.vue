<template>
  <div class="relative w-full flex flex-col">
    <div class="relative">
      <div class="absolute left-5 top-0 h-full flex flex-col">
        <div class="w-full bg-primary transition-all duration-500 ease-in-out"></div>
        <div class="w-full flex-grow border-l-2 border-dashed bg-primary border-primary"></div>

        <div class="relative p-4">
          <template v-if="isOrderStatus">
            <div
              v-for="(step, index) in orderStatusSteps"
              :key="index"
              class="flex mb-8 relative"
              :class="[
                alternating ? (index % 2 === 0 ? 'justify-start' : 'justify-end') : 'justify-start'
              ]"
            >
              <!-- Step Circle -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 absolute"
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
                  class="h-6 w-6"
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
                <span v-else>{{ index + 1 }}</span>
              </div>

              <!-- Content Container -->
              <div
                class="bg-primary p-4 rounded-lg shadow-sm border"
                :class="[
                  alternating ? (index % 2 === 0 ? 'ml-16 mr-auto' : 'mr-16 ml-auto') : 'ml-16',
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
