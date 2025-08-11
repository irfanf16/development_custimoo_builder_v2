<script setup lang="ts">
  import { Card, CardContent } from '@/components/ui/card'
  import { Button } from '@/components/ui/button'

  defineProps<{ price?: number; qty?: number; eta?: string }>()
</script>

<template>
  <Card class="w-[320px] p-0">
    <CardContent class="p-4 flex items-center justify-between gap-4">
      <div class="flex flex-col">
        <div class="text-lg font-semibold">
          ${{ (price ?? 56.99).toFixed(2) }}
        </div>
        <div class="text-xs text-muted-foreground">
          for {{ qty ?? 10 }} pcs · Delivered by {{ eta ?? '25-27 Feb 2025' }}
        </div>
      </div>
      <Button size="sm" class="rounded-xl px-5">Add to cart</Button>
    </CardContent>
  </Card>
</template>

<style scoped></style>
