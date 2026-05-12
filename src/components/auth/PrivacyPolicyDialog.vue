<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    privacy_policy_page_title,
    privacy_policy_effective_date,
    privacy_policy_intro,
    privacy_policy_s1_title,
    privacy_policy_s1_content,
    privacy_policy_s2_title,
    privacy_policy_s2_content,
    privacy_policy_s3_title,
    privacy_policy_s3_content,
    privacy_policy_s4_title,
    privacy_policy_s4_content,
    privacy_policy_s5_title,
    privacy_policy_s5_content,
    privacy_policy_s6_title,
    privacy_policy_s6_content,
    privacy_policy_s7_title,
    privacy_policy_s7_content,
    privacy_policy_s8_title,
    privacy_policy_s8_content,
    privacy_policy_s9_title,
    privacy_policy_s9_content,
    privacy_policy_s10_title,
    privacy_policy_s10_content
  } from '@/paraglide/messages'

  defineProps<{ open: boolean }>()
  defineEmits<{ (e: 'update:open', value: boolean): void }>()

  const profileStore = useProfileStore()
  const { currentLocale: locale } = storeToRefs(profileStore)

  const sections = computed(() => [
    {
      title: privacy_policy_s1_title({}, { locale: locale.value }),
      content: privacy_policy_s1_content({}, { locale: locale.value })
    },
    {
      title: privacy_policy_s2_title({}, { locale: locale.value }),
      content: privacy_policy_s2_content({}, { locale: locale.value })
    },
    {
      title: privacy_policy_s3_title({}, { locale: locale.value }),
      content: privacy_policy_s3_content({}, { locale: locale.value })
    },
    {
      title: privacy_policy_s4_title({}, { locale: locale.value }),
      content: privacy_policy_s4_content({}, { locale: locale.value })
    },
    {
      title: privacy_policy_s5_title({}, { locale: locale.value }),
      content: privacy_policy_s5_content({}, { locale: locale.value })
    },
    {
      title: privacy_policy_s6_title({}, { locale: locale.value }),
      content: privacy_policy_s6_content({}, { locale: locale.value })
    },
    {
      title: privacy_policy_s7_title({}, { locale: locale.value }),
      content: privacy_policy_s7_content({}, { locale: locale.value })
    },
    {
      title: privacy_policy_s8_title({}, { locale: locale.value }),
      content: privacy_policy_s8_content({}, { locale: locale.value })
    },
    {
      title: privacy_policy_s9_title({}, { locale: locale.value }),
      content: privacy_policy_s9_content({}, { locale: locale.value })
    },
    {
      title: privacy_policy_s10_title({}, { locale: locale.value }),
      content: privacy_policy_s10_content({}, { locale: locale.value })
    }
  ])
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent
      data-testid="auth-dialog-privacy-policy"
      variant="large"
      class="flex flex-col overflow-hidden"
    >
      <DialogHeader class="shrink-0">
        <DialogTitle class="text-xl font-bold font-brand text-primary">
          {{ privacy_policy_page_title({}, { locale }) }}
        </DialogTitle>
        <p class="text-sm text-muted-foreground">
          {{ privacy_policy_effective_date({}, { locale }) }}
        </p>
      </DialogHeader>

      <ScrollArea class="flex-1 overflow-hidden pr-4">
        <div class="space-y-6 pb-6">
          <div
            class="prose-p:text-sm prose-p:text-foreground prose-p:leading-relaxed"
            v-html="privacy_policy_intro({}, { locale })"
          />

          <div
            v-for="(section, index) in sections"
            :key="index"
            :data-testid="`auth-privacy-section-${index}`"
            class="space-y-2"
          >
            <h2 class="text-base font-semibold font-brand text-primary">
              {{ section.title }}
            </h2>
            <div
              class="text-sm text-foreground leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_p]:mb-2"
              v-html="section.content"
            />
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>
