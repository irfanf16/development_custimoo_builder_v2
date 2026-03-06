<script setup lang="ts">
  import { computed } from 'vue'
  import { Button } from '@/components/ui/button'
  import { Copy } from 'lucide-vue-next'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import { toast } from 'vue-sonner'
  import { msg_link_copied } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'

  const props = defineProps<{
    shareUrl: string | null
    open?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
  }>()

  const isOpen = computed({
    get: () => props.open ?? false,
    set: value => emit('update:open', value)
  })

  function copyShareUrl(event?: Event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (!props.shareUrl) return
    const profileStore = useProfileStore()
    const locale = profileStore.currentLocale || 'en'
    navigator.clipboard.writeText(props.shareUrl).then(() => {
      toast.success(msg_link_copied({}, { locale }), {
        position: 'top-right',
        richColors: true,
        duration: 2000
      })
      // Close tooltip after a short delay
      setTimeout(() => {
        isOpen.value = false
      }, 1000)
    })
  }
</script>

<template>
  <TooltipProvider>
    <Tooltip :open="isOpen && !!shareUrl" @update:open="isOpen = $event">
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipContent
        v-if="shareUrl"
        side="bottom"
        class="w-auto max-w-md p-4 bg-popover text-popover-foreground border shadow-lg"
        data-tooltip-content="true"
        @click.stop
        @mousedown.stop
        @pointer-down-outside.stop
      >
        <div class="flex flex-col gap-3" @click.stop @mousedown.stop>
          <h4 class="font-semibold text-sm">Copy link and share</h4>
          <div class="flex items-center gap-2">
            <input
              :value="shareUrl"
              readonly
              class="flex-1 px-2 py-1 text-xs bg-background border rounded text-foreground"
              @click.stop
              @mousedown.stop
            />
            <Button size="sm" variant="outline" @click.stop="copyShareUrl" @mousedown.stop>
              <Copy class="size-3 mr-1" />
              <span class="text-xs">Copy</span>
            </Button>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
