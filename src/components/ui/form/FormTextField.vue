<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { Field } from 'vee-validate'
  import FormControl from './FormControl.vue'
  import FormItem from './FormItem.vue'
  import FormLabel from './FormLabel.vue'
  import FormMessage from './FormMessage.vue'
  import { cn } from '@/lib/utils'

  const props = withDefaults(
    defineProps<{
      name: string
      label: string
      type?: string
      placeholder?: string
      autocomplete?: string
      class?: HTMLAttributes['class']
    }>(),
    { type: 'text', placeholder: '', autocomplete: undefined, class: undefined }
  )
</script>

<template>
  <Field v-slot="{ field }" :name="name">
    <FormItem>
      <FormLabel>{{ label }}</FormLabel>
      <FormControl>
        <input
          :id="name"
          :type="type"
          :placeholder="placeholder"
          :autocomplete="autocomplete"
          :class="
            cn(
              'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-input px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
              props.class
            )
          "
          v-bind="field"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  </Field>
</template>

<style scoped>
  .form-text-field-input {
    height: 2.25rem;
    width: 100%;
    min-width: 0;
    border-radius: 0.375rem;
    border: 1px solid hsl(var(--border));
    background-color: hsl(var(--input));
    padding: 0.25rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5rem;
    transition:
      color 0.15s,
      box-shadow 0.15s;
    outline: none;
  }
  .form-text-field-input::placeholder {
    color: hsl(var(--muted-foreground));
  }
  .form-text-field-input:focus-visible {
    border-color: hsl(var(--ring));
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5);
  }
  .form-text-field-input:disabled {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.5;
  }
  @media (min-width: 768px) {
    .form-text-field-input {
      font-size: 0.875rem;
    }
  }
</style>
