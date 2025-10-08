<script setup lang="ts">
  import { Card, CardContent } from '@/components/ui/card'
  import { Button } from '@/components/ui/button'
  import { price_line, price_add_to_cart } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'

  defineProps<{ price?: number; qty?: number; eta?: string }>()
  const localeStore = useLocaleStore()
</script>

<template>
  <Card class="w-[320px] p-0">
    <CardContent class="p-4 flex items-center justify-between gap-4">
      <div class="flex flex-col">
        <div class="text-lg font-semibold">${{ (price ?? 56.99).toFixed(2) }}</div>
        <div class="text-xs text-muted-foreground">
          {{
            price_line(
              { qty: qty ?? 10, eta: eta ?? '25-27 Feb 2025' },
              { locale: localeStore.currentLocale }
            )
          }}
        </div>
      </div>
      <Button size="sm" class="rounded-xl px-5">{{
        price_add_to_cart({}, { locale: localeStore.currentLocale })
      }}</Button>
    </CardContent>
  </Card>
</template>

<style scoped></style>
