<template>
  <div
    class="relative pb-6 sm:pb-8 last:pb-0"
    :class="{
      'flex-row-reverse': alternating && index % 2 === 1
    }"
    :data-testid="`profile-timeline-item-${index}`"
  >
    <div
      class="absolute top-0 w-0.5 h-full z-[1] transition-colors"
      :class="[
        alternating && index % 2 === 1
          ? 'right-4 sm:right-5 md:right-6'
          : 'left-4 sm:left-5 md:left-5',
        isCompleted ? 'bg-green-500 dark:bg-green-600' : 'bg-primary'
      ]"
    ></div>
    <div
      class="relative flex z-[2]"
      :class="{
        'flex-row-reverse': alternating && index % 2 === 1
      }"
    >
      <div
        class="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors"
        :class="[
          alternating && index % 2 === 1 ? 'ml-3 sm:ml-4 md:ml-5 mr-0' : 'mr-3 sm:mr-4 md:mr-5',
          isActive
            ? 'bg-primary border-primary text-primary-foreground'
            : isCompleted
              ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white'
              : 'bg-primary border-primary text-primary-foreground'
        ]"
      >
        <component
          :is="isCompleted ? completedIcon : icon"
          class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6"
        />
      </div>
      <div class="flex-1 min-w-0" :class="{ 'text-right': alternating && index % 2 === 1 }">
        <div class="mb-3">
          <h3
            class="font-semibold text-sm sm:text-base flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 md:gap-6 transition-colors"
            :class="[isActive ? 'text-primary' : 'text-foreground']"
          >
            <span class="break-words">{{ title }}</span>
            <!-- <span
              class="text-muted-foreground font-normal text-sm"
              v-if="actionLog && actionLog.manual_action"
            >
              <span>Moved by {{ activityUser?.name }}</span>
              <span v-if="actionLog && actionLog.reason">: </span>
              <span v-if="actionLog && actionLog.reason">"{{ actionLog.reason }}"</span>
            </span> -->
            <span class="text-muted-foreground font-normal text-xs sm:text-sm whitespace-nowrap">{{
              activityDateTime
            }}</span>
          </h3>
          <div
            class="text-xs sm:text-sm text-muted-foreground block [&_ul]:list-disc [&_ul]:ml-4"
            v-html="attribution"
          ></div>
          <template v-if="!attribution">
            <div
              class="flex items-start sm:items-center gap-3 sm:gap-4 bg-primary/10 dark:bg-primary/20 border border-primary rounded-lg p-3 sm:p-4 md:p-6 text-primary mt-3"
            >
              <div class="flex-shrink-0">
                <svg
                  class="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="text-xs sm:text-sm leading-relaxed">
                <span class="font-semibold">Important:</span>
                <span class="ml-2">No Further Changes Can Be Made At This Stage.</span>
              </div>
            </div>
          </template>
        </div>
        <div class="bg-muted rounded-lg p-3 sm:p-4 md:p-6 border border-border">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { User } from '@/services/orders/types'
  import { computed, inject, type Component } from 'vue'

  interface Props {
    title?: string
    attribution?: string
    index?: number
    totalItems?: number
    currentStep?: number
    icon?: Component
    completedIcon?: Component
    alternating?: boolean
    activityDateTime: string
    // actionLog: ActionLog;
    activityUser?: User
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '',
    attribution: '',
    index: 0,
    totalItems: 1,
    currentStep: undefined,
    icon: undefined,
    completedIcon: () => import('@/icons/streamline/flex-flat/cricket.svg'),
    alternating: undefined,
    // actionLog: undefined,
    activityUser: undefined
  })

  // Try to get currentStep and alternating from parent Timeline if not provided directly
  const parentCurrentStep = inject('currentStep', 0)
  const parentAlternating = inject('alternating', true)

  const currentStep = computed(() =>
    props.currentStep !== undefined ? props.currentStep : parentCurrentStep
  )
  const alternating = computed(() =>
    props.alternating !== undefined ? props.alternating : parentAlternating
  )

  const isActive = computed(() => props.index === currentStep.value)
  const isCompleted = computed(() => props.index < currentStep.value)

  // Define emits explicitly
  defineEmits(['click'])
</script>

<!-- <style scoped>
</style> -->
